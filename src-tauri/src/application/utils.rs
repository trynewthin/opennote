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
    // canonicalize adds \\?\ on Windows; strip it so starts_with comparisons
    // against paths already processed by normalize_unc_path remain consistent.
    let canonical = std::fs::canonicalize(workspace).unwrap_or_else(|_| workspace.to_path_buf());
    let normalized_workspace = normalize_unc_path(&canonical);

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

/// Normalise a path produced by `std::fs::canonicalize` by stripping the
/// Windows extended-length UNC prefix (`\\?\`) when present.
///
/// On Windows, `canonicalize` prepends `\\?\` to absolute paths to bypass the
/// MAX_PATH limit. While safe for kernel-level I/O, this prefix breaks web URI
/// rendering in Tauri's webview (which expects a plain `C:\…` path) and causes
/// unexpected failures in `starts_with` comparisons against user-supplied paths
/// that were not canonicalized.
///
/// On non-Windows platforms, this function is a no-op.
pub fn normalize_unc_path(path: &Path) -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        const UNC_PREFIX: &str = r"\\?\";
        let s = path.to_string_lossy();
        if let Some(stripped) = s.strip_prefix(UNC_PREFIX) {
            return PathBuf::from(stripped);
        }
    }
    path.to_path_buf()
}
