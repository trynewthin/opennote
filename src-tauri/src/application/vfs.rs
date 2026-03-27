// VfsLayer is Phase 1 infrastructure prepared for the milestone-3 VFS-backed read
// pipeline. When `AppState` is wired into Tauri commands, all file-tree reads will
// go through this cache instead of hitting `std::fs::read_dir` on every call.
#![allow(dead_code)]

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use crate::error::AppResult;
use crate::models::WorkspaceFileEntry;

const EXCLUDED_DIR_NAMES: &[&str] = &["attachments"];

/// In-memory cache of the workspace file system tree.
///
/// Previously, `FileService::scan_all_files` and `ProjectService::scan_workspace`
/// each performed independent `std::fs::read_dir` traversals on every call.
/// `VfsLayer` replaces both with a single traversal result kept in memory and
/// refreshed only when the workspace changes or a file mutation occurs.
///
/// All consumers (file tree display, project listing, folder enumeration) read
/// from this cache rather than hitting the disk directly, eliminating redundant
/// I/O for normal read operations.
#[derive(Default)]
pub struct VfsLayer {
    /// Full recursive tree rooted at the workspace directory.
    /// Populated by `refresh`. Empty until the first workspace is opened.
    pub tree: Vec<WorkspaceFileEntry>,

    /// Flat index: normalised absolute path → entry metadata.
    /// Used for O(1) existence and metadata lookups without re-traversing the tree.
    pub index: HashMap<PathBuf, EntryMeta>,
}

/// Lightweight metadata record stored in the flat index.
#[derive(Debug, Clone)]
pub struct EntryMeta {
    pub kind: EntryKind,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EntryKind {
    File,
    Directory,
}

impl VfsLayer {
    /// Rebuild the in-memory tree and flat index from disk.
    ///
    /// Called by `AppState::set_workspace` on workspace open and should be
    /// called again after any mutation that changes the directory structure
    /// (create folder, rename, delete).
    pub fn refresh(&mut self, workspace_root: &Path) -> AppResult<()> {
        self.index.clear();
        self.tree = self.scan_dir(workspace_root, workspace_root)?;
        Ok(())
    }

    /// Returns all top-level workspace entries (directories first, then files,
    /// each sorted case-insensitively by name).
    pub fn root_entries(&self) -> &[WorkspaceFileEntry] {
        &self.tree
    }

    /// Returns `true` if the given absolute path is tracked by the VFS.
    pub fn contains(&self, path: &Path) -> bool {
        self.index.contains_key(path)
    }

    /// Collect all `.on` project files from the flat index.
    pub fn project_paths(&self) -> Vec<PathBuf> {
        self.index
            .iter()
            .filter(|(path, meta)| {
                meta.kind == EntryKind::File
                    && path.extension().and_then(|e| e.to_str()) == Some("on")
            })
            .map(|(path, _)| path.clone())
            .collect()
    }

    /// Collect all directory paths (for folder listings).
    pub fn directory_paths(&self) -> Vec<PathBuf> {
        self.index
            .iter()
            .filter(|(_, meta)| meta.kind == EntryKind::Directory)
            .map(|(path, _)| path.clone())
            .collect()
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    fn scan_dir(
        &mut self,
        workspace_root: &Path,
        dir: &Path,
    ) -> AppResult<Vec<WorkspaceFileEntry>> {
        let mut entries = Vec::new();

        for fs_entry in std::fs::read_dir(dir)? {
            let fs_entry = fs_entry?;
            let path = fs_entry.path();
            let name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            // Skip hidden directories / entries and known excluded names.
            if name.starts_with('.') || EXCLUDED_DIR_NAMES.contains(&name.as_str()) {
                continue;
            }

            if path.is_dir() {
                let children = self.scan_dir(workspace_root, &path)?;
                self.index.insert(
                    path.clone(),
                    EntryMeta {
                        kind: EntryKind::Directory,
                        name: name.clone(),
                    },
                );
                entries.push(WorkspaceFileEntry {
                    path: path.to_string_lossy().to_string(),
                    name,
                    kind: "directory".into(),
                    children,
                });
            } else {
                self.index.insert(
                    path.clone(),
                    EntryMeta {
                        kind: EntryKind::File,
                        name: name.clone(),
                    },
                );
                entries.push(WorkspaceFileEntry {
                    path: path.to_string_lossy().to_string(),
                    name,
                    kind: "file".into(),
                    children: vec![],
                });
            }
        }

        sort_entries(&mut entries);
        Ok(entries)
    }
}

fn sort_entries(entries: &mut Vec<WorkspaceFileEntry>) {
    entries.sort_by(|left, right| {
        let left_is_dir = left.kind == "directory";
        let right_is_dir = right.kind == "directory";
        right_is_dir
            .cmp(&left_is_dir)
            .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
    });
}
