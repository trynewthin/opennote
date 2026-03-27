use std::path::Path;

use super::utils::validate_workspace_relative_path;
use crate::application::{AppResult, WorkspaceService};
use crate::error::AppError;
use crate::models::WorkspaceFileEntry;

pub struct FileService<'a> {
    workspace: &'a WorkspaceService<'a>,
}

impl<'a> FileService<'a> {
    pub fn new(workspace: &'a WorkspaceService<'a>) -> Self {
        Self { workspace }
    }

    pub fn rename_file(&self, path: &str, new_name: &str) -> AppResult<String> {
        let old_path = self.workspace.ensure_within_workspace(path)?;
        let new_name = new_name.trim();
        if new_name.is_empty() || new_name.contains('/') || new_name.contains('\\') {
            return Err(AppError::Validation("Invalid file name".into()));
        }

        let parent = old_path
            .parent()
            .ok_or_else(|| AppError::InvalidWorkspace("Cannot rename workspace root".into()))?;
        let new_path = parent.join(new_name);
        if new_path.exists() {
            return Err(AppError::Validation(format!(
                "A file named '{}' already exists",
                new_name
            )));
        }

        std::fs::rename(&old_path, &new_path)?;
        Ok(new_path.to_string_lossy().to_string())
    }

    pub fn delete_file(&self, path: &str) -> AppResult<()> {
        let target = self.workspace.ensure_within_workspace(path)?;
        if target.is_dir() {
            std::fs::remove_dir_all(&target)?;
        } else {
            std::fs::remove_file(&target)?;
        }
        Ok(())
    }

    pub fn create_folder(&self, folder_path: &str) -> AppResult<()> {
        let workspace = self.workspace.workspace_dir()?;
        let relative = validate_workspace_relative_path(folder_path)?;
        let target = workspace.join(relative);
        std::fs::create_dir_all(&target)?;
        Ok(())
    }

    pub fn list_folders(&self) -> AppResult<Vec<String>> {
        let workspace = self.workspace.workspace_dir()?;
        let mut folders = Vec::new();
        self.collect_folders(&workspace, &mut folders)?;
        Ok(folders)
    }

    fn collect_folders(&self, dir: &Path, folders: &mut Vec<String>) -> AppResult<()> {
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            let name = path
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or("");
            if name.starts_with('.') || name == "attachments" {
                continue;
            }

            folders.push(path.to_string_lossy().to_string());
            self.collect_folders(&path, folders)?;
        }
        Ok(())
    }

    pub fn scan_all_files(&self) -> AppResult<Vec<WorkspaceFileEntry>> {
        let workspace = self.workspace.workspace_dir()?;
        let mut entries = self.scan_dir_all(&workspace)?;
        sort_entries(&mut entries);
        Ok(entries)
    }

    fn scan_dir_all(&self, dir: &Path) -> AppResult<Vec<WorkspaceFileEntry>> {
        let mut entries = Vec::new();
        for fs_entry in std::fs::read_dir(dir)? {
            let fs_entry = fs_entry?;
            let path = fs_entry.path();
            let name = path
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or("")
                .to_string();

            if is_excluded_static(&name) {
                continue;
            }

            if path.is_dir() {
                let mut children = self.scan_dir_all(&path)?;
                sort_entries(&mut children);
                entries.push(WorkspaceFileEntry {
                    path: path.to_string_lossy().to_string(),
                    name,
                    kind: "directory".into(),
                    children,
                });
            } else {
                entries.push(WorkspaceFileEntry {
                    path: path.to_string_lossy().to_string(),
                    name,
                    kind: "file".into(),
                    children: vec![],
                });
            }
        }
        Ok(entries)
    }
}

const EXCLUDE_PATTERNS: &[&str] = &[];

fn is_excluded<T: AsRef<str>>(name: &str, patterns: &[T]) -> bool {
    patterns
        .iter()
        .map(AsRef::as_ref)
        .any(|pattern| matches_excluded_pattern(name, pattern))
}

fn is_excluded_static(name: &str) -> bool {
    is_excluded(name, EXCLUDE_PATTERNS)
}

fn matches_excluded_pattern(name: &str, pattern: &str) -> bool {
    if let Some(suffix) = pattern.strip_prefix('*') {
        name.ends_with(suffix)
    } else if let Some(prefix) = pattern.strip_suffix('*') {
        name.starts_with(prefix)
    } else {
        name == pattern
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
