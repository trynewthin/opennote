use std::collections::{HashMap, VecDeque};
use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;
use std::time::UNIX_EPOCH;

use crate::application::AppResult;
use crate::db::Database;
use crate::error::AppError;
use crate::format::{JsonOnFormat, OnFormat, PathResolver, ProjectData, RelativePathResolver};
use crate::models::{LoadedProject, WorkspaceFileEntry, WorkspaceProjectSummary};

pub struct CurrentWorkspace(pub Mutex<Option<PathBuf>>);

impl Default for CurrentWorkspace {
    fn default() -> Self {
        Self(Mutex::new(None))
    }
}

const CREATE_PROJECT_REQUEST_CACHE_LIMIT: usize = 128;

#[derive(Default)]
struct CreateProjectRequestCacheState {
    order: VecDeque<String>,
    entries: HashMap<String, WorkspaceProjectSummary>,
}

pub struct CreateProjectRequestCache(Mutex<CreateProjectRequestCacheState>);

impl Default for CreateProjectRequestCache {
    fn default() -> Self {
        Self(Mutex::new(CreateProjectRequestCacheState::default()))
    }
}

impl CreateProjectRequestCache {
    fn get(&self, request_id: &str) -> Option<WorkspaceProjectSummary> {
        self.0.lock().unwrap().entries.get(request_id).cloned()
    }

    fn remember(&self, request_id: &str, summary: WorkspaceProjectSummary) {
        let mut state = self.0.lock().unwrap();
        if state.entries.contains_key(request_id) {
            return;
        }

        state.order.push_back(request_id.to_string());
        state.entries.insert(request_id.to_string(), summary);

        while state.order.len() > CREATE_PROJECT_REQUEST_CACHE_LIMIT {
            if let Some(expired) = state.order.pop_front() {
                state.entries.remove(&expired);
            }
        }
    }
}

pub struct WorkspaceService<'a> {
    db: &'a Database,
    current_workspace: &'a CurrentWorkspace,
    create_request_cache: &'a CreateProjectRequestCache,
    format: Box<dyn OnFormat>,
    path_resolver: Box<dyn PathResolver>,
}

impl<'a> WorkspaceService<'a> {
    pub fn new(
        db: &'a Database,
        current_workspace: &'a CurrentWorkspace,
        create_request_cache: &'a CreateProjectRequestCache,
    ) -> Self {
        Self {
            db,
            current_workspace,
            create_request_cache,
            format: Box::<JsonOnFormat>::default(),
            path_resolver: Box::<RelativePathResolver>::default(),
        }
    }

    pub fn open_workspace(&self, workspace_path: &str) -> AppResult<Vec<WorkspaceProjectSummary>> {
        let path = PathBuf::from(workspace_path);
        if !path.is_dir() {
            return Err(AppError::InvalidWorkspace(format!(
                "Workspace does not exist: {}",
                path.display()
            )));
        }

        *self.current_workspace.0.lock().unwrap() = Some(path.clone());
        self.db.push_recent_workspace(workspace_path)?;
        self.db.set_last_workspace(Some(workspace_path))?;
        self.scan_workspace(&path)
    }

    pub fn list_projects(&self) -> AppResult<Vec<WorkspaceProjectSummary>> {
        let workspace = self.workspace_dir()?;
        self.scan_workspace(&workspace)
    }

    pub fn create_project(
        &self,
        name: &str,
        description: &str,
        folder_path: Option<&str>,
        request_id: Option<&str>,
    ) -> AppResult<WorkspaceProjectSummary> {
        if let Some(request_id) = request_id {
            if let Some(existing) = self.create_request_cache.get(request_id) {
                return Ok(existing);
            }
        }

        let workspace = self.workspace_dir()?;
        let target_dir = match folder_path {
            Some(path) => workspace.join(validate_workspace_relative_path(path)?),
            None => workspace.clone(),
        };
        std::fs::create_dir_all(&target_dir)?;
        let path = self.allocate_project_path(&target_dir, name);
        let data = ProjectData::new(name, description);
        self.write_project_file(&path, &data)?;
        let summary = self.summary_from_data(&path, &data)?;

        if let Some(request_id) = request_id {
            self.create_request_cache.remember(request_id, summary.clone());
        }

        Ok(summary)
    }

    pub fn delete_project(&self, project_path: &str) -> AppResult<()> {
        let path = self.ensure_project_path(project_path)?;
        if path.exists() {
            std::fs::remove_file(path)?;
        }
        Ok(())
    }

    pub fn load_project(&self, project_path: &str) -> AppResult<LoadedProject> {
        let path = self.ensure_project_path(project_path)?;
        let data = self.read_project_file(&path)?;
        Ok(LoadedProject {
            path: path.to_string_lossy().to_string(),
            data,
        })
    }

    pub fn save_project(
        &self,
        project_path: &str,
        data: &ProjectData,
    ) -> AppResult<WorkspaceProjectSummary> {
        let current_path = self.ensure_project_path(project_path)?;
        let workspace = self.workspace_dir()?;
        let target_path = self.target_path_for_project(&workspace, &current_path, &data.name);

        self.write_project_file(&target_path, data)?;
        if current_path != target_path && current_path.exists() {
            std::fs::remove_file(current_path)?;
        }

        self.summary_from_data(&target_path, data)
    }

    pub fn copy_attachment(&self, project_path: &str, source_path: &str) -> AppResult<String> {
        let project_file = self.ensure_project_path(project_path)?;
        let source = PathBuf::from(source_path);
        if !source.is_file() {
            return Err(AppError::NotFound(format!(
                "Attachment source does not exist: {}",
                source.display()
            )));
        }

        let attachments_dir = project_file
            .parent()
            .ok_or_else(|| {
                AppError::InvalidWorkspace("Project file has no parent directory".into())
            })?
            .join("attachments");
        std::fs::create_dir_all(&attachments_dir)?;

        let file_name = source
            .file_name()
            .and_then(|value| value.to_str())
            .ok_or_else(|| AppError::Validation("Attachment file name is invalid".into()))?;
        let destination = allocate_unique_path(&attachments_dir, file_name);
        std::fs::copy(&source, &destination)?;

        self.path_resolver.to_reference(&project_file, &destination)
    }

    pub fn resolve_reference(
        &self,
        project_path: &Path,
        reference: &str,
    ) -> AppResult<Option<PathBuf>> {
        self.path_resolver.resolve(project_path, reference)
    }

    pub fn create_folder(&self, folder_path: &str) -> AppResult<()> {
        let workspace = self.workspace_dir()?;
        let relative = validate_workspace_relative_path(folder_path)?;
        let target = workspace.join(relative);
        std::fs::create_dir_all(&target)?;
        Ok(())
    }

    pub fn list_folders(&self) -> AppResult<Vec<String>> {
        let workspace = self.workspace_dir()?;
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
            let name = path.file_name().and_then(|v| v.to_str()).unwrap_or("");
            if name.starts_with('.') || name == "attachments" {
                continue;
            }
            folders.push(path.to_string_lossy().to_string());
            self.collect_folders(&path, folders)?;
        }
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

    pub fn rename_file(&self, path: &str, new_name: &str) -> AppResult<String> {
        let old_path = self.ensure_within_workspace(path)?;
        let new_name = new_name.trim();
        if new_name.is_empty() || new_name.contains('/') || new_name.contains('\\') {
            return Err(AppError::Validation("Invalid file name".into()));
        }
        let parent = old_path.parent().ok_or_else(|| {
            AppError::InvalidWorkspace("Cannot rename workspace root".into())
        })?;
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
        let target = self.ensure_within_workspace(path)?;
        if target.is_dir() {
            std::fs::remove_dir_all(&target)?;
        } else {
            std::fs::remove_file(&target)?;
        }
        Ok(())
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

    /// Recursively scan all files and directories in the workspace.
    /// Recursively scan all files and directories in the workspace.
    /// Entries matching EXCLUDE_PATTERNS (hardcoded in Rust) are skipped.
    pub fn scan_all_files(&self) -> AppResult<Vec<WorkspaceFileEntry>> {
        let workspace = self.workspace_dir()?;
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
                .and_then(|n| n.to_str())
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
                    kind: "directory".to_string(),
                    children,
                });
            } else {
                entries.push(WorkspaceFileEntry {
                    path: path.to_string_lossy().to_string(),
                    name,
                    kind: "file".to_string(),
                    children: vec![],
                });
            }
        }
        Ok(entries)
    }

    fn scan_workspace(&self, workspace: &Path) -> AppResult<Vec<WorkspaceProjectSummary>> {
        let mut projects = Vec::new();
        self.scan_dir(workspace, &mut projects)?;
        projects.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
        Ok(projects)
    }

    fn scan_dir(&self, dir: &Path, projects: &mut Vec<WorkspaceProjectSummary>) -> AppResult<()> {
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                // Skip hidden dirs and attachments
                let name = path.file_name().and_then(|v| v.to_str()).unwrap_or("");
                if name.starts_with('.') || name == "attachments" {
                    continue;
                }
                self.scan_dir(&path, projects)?;
                continue;
            }

            if path.extension().and_then(|value| value.to_str()) != Some("on") {
                continue;
            }

            match self.read_project_file(&path) {
                Ok(data) => {
                    if let Ok(summary) = self.summary_from_data(&path, &data) {
                        projects.push(summary);
                    }
                }
                Err(error) => {
                    log::warn!(
                        "Skipping unreadable project file {}: {}",
                        path.display(),
                        error
                    );
                }
            }
        }
        Ok(())
    }

    fn read_project_file(&self, path: &Path) -> AppResult<ProjectData> {
        let raw = std::fs::read_to_string(path)?;
        self.format.deserialize(&raw)
    }

    fn write_project_file(&self, path: &Path, data: &ProjectData) -> AppResult<()> {
        let raw = self.format.serialize(data)?;
        std::fs::write(path, raw)?;
        Ok(())
    }

    fn summary_from_data(
        &self,
        path: &Path,
        data: &ProjectData,
    ) -> AppResult<WorkspaceProjectSummary> {
        let metadata = std::fs::metadata(path)?;
        let updated_at = metadata
            .modified()
            .ok()
            .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
            .map(|duration| duration.as_millis() as i64)
            .unwrap_or_default();

        Ok(WorkspaceProjectSummary {
            path: path.to_string_lossy().to_string(),
            name: data.name.clone(),
            description: data.description.clone(),
            updated_at,
            node_count: data.nodes.len(),
        })
    }

    fn ensure_project_path(&self, project_path: &str) -> AppResult<PathBuf> {
        let workspace = self.workspace_dir()?;
        let raw = PathBuf::from(project_path);
        let normalized = match std::fs::canonicalize(&raw) {
            Ok(path) => path,
            Err(_) => raw,
        };
        let workspace_normalized = std::fs::canonicalize(&workspace).unwrap_or(workspace);
        if !normalized.starts_with(&workspace_normalized) {
            return Err(AppError::InvalidWorkspace(format!(
                "Project file is outside the current workspace: {}",
                normalized.display()
            )));
        }
        Ok(normalized)
    }

    fn allocate_project_path(&self, base_dir: &Path, name: &str) -> PathBuf {
        allocate_unique_path(base_dir, &format!("{}.on", sanitize_file_name(name)))
    }

    fn target_path_for_project(
        &self,
        workspace: &Path,
        current_path: &Path,
        name: &str,
    ) -> PathBuf {
        let target_dir = project_base_dir_for_save(workspace, current_path);
        let desired = target_dir.join(format!("{}.on", sanitize_file_name(name)));
        if desired == current_path || !desired.exists() {
            return desired;
        }

        let stem = desired
            .file_stem()
            .and_then(|value| value.to_str())
            .unwrap_or("project");
        let ext = desired
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("on");
        let mut index = 2;
        loop {
            let candidate = target_dir.join(format!("{stem}-{index}.{ext}"));
            if candidate == current_path || !candidate.exists() {
                return candidate;
            }
            index += 1;
        }
    }
}

fn sanitize_file_name(name: &str) -> String {
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

fn validate_workspace_relative_path(folder_path: &str) -> AppResult<PathBuf> {
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

fn project_base_dir_for_save(workspace: &Path, current_path: &Path) -> PathBuf {
    let normalized_workspace = std::fs::canonicalize(workspace).unwrap_or_else(|_| workspace.to_path_buf());

    current_path
        .parent()
        .filter(|path| path.starts_with(&normalized_workspace))
        .map(Path::to_path_buf)
        .unwrap_or(normalized_workspace)
}

fn allocate_unique_path(base_dir: &Path, file_name: &str) -> PathBuf {
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

/// Patterns to exclude from the file tree scan.
/// Each entry can be:
///   - An exact name  (e.g. ".git")
///   - A glob-style wildcard prefix  (e.g. "*.tmp"  → matches any name ending in ".tmp")
///   - A glob-style wildcard suffix  (e.g. "node_*" → matches any name starting with "node_")
/// Currently empty – all files and directories are visible.
const EXCLUDE_PATTERNS: &[&str] = &[];

fn is_excluded(name: &str, patterns: &[String]) -> bool {
    for pattern in patterns {
        let p = pattern.as_str();
        let matched = if let Some(suffix) = p.strip_prefix('*') {
            name.ends_with(suffix)
        } else if let Some(prefix) = p.strip_suffix('*') {
            name.starts_with(prefix)
        } else {
            name == p
        };
        if matched {
            return true;
        }
    }
    false
}

fn is_excluded_static(name: &str) -> bool {
    for pattern in EXCLUDE_PATTERNS {
        let matched = if let Some(suffix) = pattern.strip_prefix('*') {
            name.ends_with(suffix)
        } else if let Some(prefix) = pattern.strip_suffix('*') {
            name.starts_with(prefix)
        } else {
            name == *pattern
        };
        if matched {
            return true;
        }
    }
    false
}

fn sort_entries(entries: &mut Vec<crate::models::WorkspaceFileEntry>) {
    entries.sort_by(|a, b| {
        // Directories first, then files; within each group sort by name
        let a_is_dir = a.kind == "directory";
        let b_is_dir = b.kind == "directory";
        b_is_dir.cmp(&a_is_dir).then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Database;
    use crate::format::ProjectData;
    use std::fs;
    use uuid::Uuid;

    fn unique_test_dir(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("opennote-{name}-{}", Uuid::new_v4()))
    }

    #[test]
    fn project_save_keeps_current_parent_folder_inside_workspace() {
        let workspace = Path::new("D:/workspace");
        let current_path = Path::new("D:/workspace/folder/nested/example.on");

        let base_dir = project_base_dir_for_save(workspace, current_path);

        assert_eq!(base_dir, PathBuf::from("D:/workspace/folder/nested"));
    }

    #[test]
    fn project_save_falls_back_to_workspace_for_outside_paths() {
        let workspace = Path::new("D:/workspace");
        let current_path = Path::new("D:/other/example.on");

        let base_dir = project_base_dir_for_save(workspace, current_path);

        assert_eq!(base_dir, PathBuf::from("D:/workspace"));
    }

    #[test]
    fn create_and_save_nested_project_keeps_file_in_nested_folder() {
        let workspace_dir = unique_test_dir("workspace-service");
        let db_path = workspace_dir.join("state.db");
        fs::create_dir_all(&workspace_dir).unwrap();

        let db = Database::new(db_path.to_str().unwrap()).unwrap();
        let current_workspace = CurrentWorkspace::default();
        let create_request_cache = CreateProjectRequestCache::default();
        let service = WorkspaceService::new(&db, &current_workspace, &create_request_cache);

        service
            .open_workspace(workspace_dir.to_str().unwrap())
            .unwrap();
        service.create_folder("folder").unwrap();

        let created = service
            .create_project("nested-note", "desc", Some("folder"), Some("req-create"))
            .unwrap();
        let created_path = PathBuf::from(&created.path);
        assert!(created_path.ends_with(Path::new("folder").join("nested-note.on")));
        assert!(created_path.exists());

        let mut loaded = service.load_project(&created.path).unwrap();
        loaded.data.description = "updated".into();

        let saved = service.save_project(&created.path, &loaded.data).unwrap();
        let saved_path = PathBuf::from(&saved.path);
        let root_path = workspace_dir.join("nested-note.on");
        let canonical_saved = fs::canonicalize(&saved_path).unwrap();
        let canonical_created = fs::canonicalize(&created_path).unwrap();

        assert_eq!(canonical_saved, canonical_created);
        assert!(saved_path.exists());
        assert!(!root_path.exists());

        let projects = service.list_projects().unwrap();
        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].path, created.path);

        let saved_data: ProjectData = service.read_project_file(&saved_path).unwrap();
        assert_eq!(saved_data.description, "updated");

        drop(service);
        drop(create_request_cache);
        drop(current_workspace);
        drop(db);
        fs::remove_dir_all(&workspace_dir).unwrap();
    }
}
