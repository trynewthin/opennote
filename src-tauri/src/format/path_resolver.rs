use std::path::{Path, PathBuf};

use crate::error::{AppError, AppResult};

pub trait PathResolver: Send + Sync {
    fn resolve(&self, project_file: &Path, reference: &str) -> AppResult<Option<PathBuf>>;
    fn to_reference(&self, project_file: &Path, target_path: &Path) -> AppResult<String>;
}

#[derive(Default)]
pub struct RelativePathResolver;

impl PathResolver for RelativePathResolver {
    fn resolve(&self, project_file: &Path, reference: &str) -> AppResult<Option<PathBuf>> {
        let trimmed = reference.trim();
        if trimmed.is_empty() {
            return Ok(None);
        }

        let candidate = PathBuf::from(trimmed);
        let base_dir = project_file.parent().ok_or_else(|| {
            AppError::InvalidWorkspace("Project file has no parent directory".into())
        })?;
        let absolute = if candidate.is_absolute() {
            candidate
        } else {
            base_dir.join(candidate)
        };

        match std::fs::canonicalize(&absolute) {
            Ok(path) => Ok(Some(path)),
            Err(_) => Ok(Some(absolute)),
        }
    }

    fn to_reference(&self, project_file: &Path, target_path: &Path) -> AppResult<String> {
        let base_dir = project_file.parent().ok_or_else(|| {
            AppError::InvalidWorkspace("Project file has no parent directory".into())
        })?;
        let relative = pathdiff::diff_paths(target_path, base_dir).ok_or_else(|| {
            AppError::Validation(format!(
                "Failed to build relative path from {} to {}",
                project_file.display(),
                target_path.display()
            ))
        })?;
        Ok(relative.to_string_lossy().replace('\\', "/"))
    }
}
