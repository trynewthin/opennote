use std::path::PathBuf;
use std::sync::Mutex;

use crate::application::AppResult;
use crate::db::Database;
use crate::error::AppError;

pub struct CurrentWorkspace(pub Mutex<Option<PathBuf>>);

impl Default for CurrentWorkspace {
    fn default() -> Self {
        Self(Mutex::new(None))
    }
}

pub struct WorkspaceService<'a> {
    db: &'a Database,
    current_workspace: &'a CurrentWorkspace,
}

impl<'a> WorkspaceService<'a> {
    pub fn new(db: &'a Database, current_workspace: &'a CurrentWorkspace) -> Self {
        Self {
            db,
            current_workspace,
        }
    }

    pub fn open_workspace(&self, workspace_path: &str) -> AppResult<()> {
        let path = PathBuf::from(workspace_path);
        if !path.is_dir() {
            return Err(AppError::InvalidWorkspace(format!(
                "Workspace does not exist: {}",
                path.display()
            )));
        }

        *self.current_workspace.0.lock().unwrap() = Some(path);
        self.db.push_recent_workspace(workspace_path)?;
        self.db.set_last_workspace(Some(workspace_path))?;
        Ok(())
    }

    pub fn workspace_dir(&self) -> AppResult<PathBuf> {
        self.current_workspace
            .0
            .lock()
            .unwrap()
            .clone()
            .ok_or_else(|| AppError::InvalidWorkspace("No workspace is currently open".into()))
    }

    pub fn ensure_within_workspace(&self, path: &str) -> AppResult<PathBuf> {
        let workspace = self.workspace_dir()?;
        let raw = PathBuf::from(path);
        let normalized = std::fs::canonicalize(&raw).unwrap_or(raw);
        let workspace_normalized = std::fs::canonicalize(&workspace).unwrap_or(workspace);
        if !normalized.starts_with(&workspace_normalized) {
            return Err(AppError::InvalidWorkspace(format!(
                "Path is outside the current workspace: {}",
                normalized.display()
            )));
        }
        Ok(normalized)
    }

    pub fn ensure_project_path(&self, project_path: &str) -> AppResult<PathBuf> {
        let workspace = self.workspace_dir()?;
        let raw = PathBuf::from(project_path);
        let normalized = std::fs::canonicalize(&raw).unwrap_or(raw);
        let workspace_normalized = std::fs::canonicalize(&workspace).unwrap_or(workspace);
        if !normalized.starts_with(&workspace_normalized) {
            return Err(AppError::InvalidWorkspace(format!(
                "Project file is outside the current workspace: {}",
                normalized.display()
            )));
        }
        Ok(normalized)
    }
}
