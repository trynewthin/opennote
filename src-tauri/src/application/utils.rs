use std::path::{Component, Path, PathBuf};

use crate::error::{AppError, AppResult};

pub fn sanitize_file_name(name: &str) -> String {
    let trimmed = name.trim();
    let fallback = if trimmed.is_empty() {
        "untitled"
    } else {
        trimmed
    };

    fallback
        .chars()
        .map(|ch| match ch {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            _ => ch,
        })
        .collect()
}

pub fn validate_workspace_relative_path(folder_path: &str) -> AppResult<PathBuf> {
    let trimmed = folder_path.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation("Folder path cannot be empty".into()));
    }

    let path = Path::new(trimmed);
    if path.is_absolute() {
        return Err(AppError::InvalidWorkspace(format!(
            "Folder path must be relative to the workspace: {}",
            folder_path
        )));
    }

    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            Component::Normal(part) => normalized.push(part),
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(AppError::InvalidWorkspace(format!(
                    "Folder path is outside the workspace: {}",
                    folder_path
                )));
            }
        }
    }

    if normalized.as_os_str().is_empty() {
        return Err(AppError::Validation("Folder path cannot be empty".into()));
    }

    Ok(normalized)
}

pub fn project_base_dir_for_save(workspace: &Path, current_path: &Path) -> PathBuf {
    let normalized_workspace =
        std::fs::canonicalize(workspace).unwrap_or_else(|_| workspace.to_path_buf());

    current_path
        .parent()
        .filter(|path| path.starts_with(&normalized_workspace))
        .map(Path::to_path_buf)
        .unwrap_or(normalized_workspace)
}

pub fn allocate_unique_path(base_dir: &Path, file_name: &str) -> PathBuf {
    let candidate = base_dir.join(file_name);
    if !candidate.exists() {
        return candidate;
    }

    let stem = candidate
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("item");
    let ext = candidate
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("");
    let mut index = 2;
    loop {
        let candidate = if ext.is_empty() {
            base_dir.join(format!("{stem}-{index}"))
        } else {
            base_dir.join(format!("{stem}-{index}.{ext}"))
        };
        if !candidate.exists() {
            return candidate;
        }
        index += 1;
    }
}
