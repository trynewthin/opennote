use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;
use std::time::UNIX_EPOCH;

use crate::application::AppResult;
use crate::db::Database;
use crate::error::AppError;
use crate::format::{JsonOnFormat, OnFormat, PathResolver, ProjectData, RelativePathResolver};
use crate::models::{LoadedProject, WorkspaceProjectSummary};

pub struct CurrentWorkspace(pub Mutex<Option<PathBuf>>);

impl Default for CurrentWorkspace {
    fn default() -> Self {
        Self(Mutex::new(None))
    }
}

pub struct WorkspaceService<'a> {
    db: &'a Database,
    current_workspace: &'a CurrentWorkspace,
    format: Box<dyn OnFormat>,
    path_resolver: Box<dyn PathResolver>,
}

impl<'a> WorkspaceService<'a> {
    pub fn new(db: &'a Database, current_workspace: &'a CurrentWorkspace) -> Self {
        Self {
            db,
            current_workspace,
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
    ) -> AppResult<WorkspaceProjectSummary> {
        let workspace = self.workspace_dir()?;
        let path = self.allocate_project_path(&workspace, name);
        let data = ProjectData::new(name, description);
        self.write_project_file(&path, &data)?;
        self.summary_from_data(&path, &data)
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

    fn allocate_project_path(&self, workspace: &Path, name: &str) -> PathBuf {
        allocate_unique_path(workspace, &format!("{}.on", sanitize_file_name(name)))
    }

    fn target_path_for_project(
        &self,
        workspace: &Path,
        current_path: &Path,
        name: &str,
    ) -> PathBuf {
        let desired = workspace.join(format!("{}.on", sanitize_file_name(name)));
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
            let candidate = workspace.join(format!("{stem}-{index}.{ext}"));
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
