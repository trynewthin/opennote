// AppState is Phase 1 infrastructure for the milestone-3 unified DI container.
// When wired into Tauri commands via `tauri::State<AppState>`, it will replace
// the separate `CurrentWorkspace` state and provide VFS cache access to all commands.
#![allow(dead_code)]

use std::path::PathBuf;
use std::sync::Mutex;

use crate::application::vfs::VfsLayer;

/// Global application state injected into Tauri commands via `tauri::State<AppState>`.
///
/// This struct centralises all shared mutable application contexts that were
/// previously scattered across standalone `CurrentWorkspace` and per-service
/// constructor calls. By managing them here, every Tauri command gets a uniform
/// single injection point and we avoid the recursive instantiation problem where
/// each service independently constructed its own `WorkspaceService` child.
pub struct AppState {
    /// The absolute path of the currently open workspace directory.
    /// `None` when no workspace has been opened yet.
    pub workspace_path: Mutex<Option<PathBuf>>,

    /// In-memory Virtual File System cache for the current workspace.
    /// Refreshed on workspace open and on file watcher notifications.
    pub vfs: Mutex<VfsLayer>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            workspace_path: Mutex::new(None),
            vfs: Mutex::new(VfsLayer::default()),
        }
    }
}

impl AppState {
    /// Read the current workspace directory, returning an error if none is open.
    pub fn workspace_dir(&self) -> crate::error::AppResult<PathBuf> {
        self.workspace_path
            .lock()
            .unwrap()
            .clone()
            .ok_or_else(|| {
                crate::error::AppError::InvalidWorkspace(
                    "No workspace is currently open".into(),
                )
            })
    }

    /// Set the open workspace and immediately refresh the VFS cache.
    pub fn set_workspace(&self, path: PathBuf) -> crate::error::AppResult<()> {
        {
            let mut guard = self.workspace_path.lock().unwrap();
            *guard = Some(path.clone());
        }
        self.vfs.lock().unwrap().refresh(&path)?;
        Ok(())
    }
}
