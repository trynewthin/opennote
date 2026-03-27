use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use super::utils::{
    allocate_unique_path, project_base_dir_for_save, sanitize_file_name,
    validate_workspace_relative_path,
};
use crate::application::{AppResult, WorkspaceService};
use crate::format::{JsonOnFormat, OnFormat, ProjectData};
use crate::models::{LoadedProject, WorkspaceProjectSummary};

pub struct ProjectService<'a> {
    workspace: &'a WorkspaceService<'a>,
    format: Box<dyn OnFormat>,
}

impl<'a> ProjectService<'a> {
    pub fn new(workspace: &'a WorkspaceService<'a>) -> Self {
        Self {
            workspace,
            format: Box::<JsonOnFormat>::default(),
        }
    }

    pub fn scan_workspace(&self) -> AppResult<Vec<WorkspaceProjectSummary>> {
        let workspace = self.workspace.workspace_dir()?;
        let mut projects = Vec::new();
        self.scan_dir(&workspace, &mut projects)?;
        projects.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
        Ok(projects)
    }

    pub fn create_project(
        &self,
        name: &str,
        description: &str,
        folder_path: Option<&str>,
    ) -> AppResult<WorkspaceProjectSummary> {
        let workspace = self.workspace.workspace_dir()?;
        let target_dir = match folder_path {
            Some(path) => workspace.join(validate_workspace_relative_path(path)?),
            None => workspace.clone(),
        };
        std::fs::create_dir_all(&target_dir)?;

        let path = self.allocate_project_path(&target_dir, name);
        let data = ProjectData::new(name, description);
        self.write_project_file(&path, &data)?;
        self.summary_from_data(&path, &data)
    }

    pub fn load_project(&self, project_path: &str) -> AppResult<LoadedProject> {
        let path = self.workspace.ensure_project_path(project_path)?;
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
        let current_path = self.workspace.ensure_project_path(project_path)?;
        let workspace = self.workspace.workspace_dir()?;
        let target_path = self.target_path_for_project(&workspace, &current_path, &data.name);

        self.write_project_file(&target_path, data)?;
        if current_path != target_path && current_path.exists() {
            std::fs::remove_file(current_path)?;
        }

        self.summary_from_data(&target_path, data)
    }

    pub fn delete_project(&self, project_path: &str) -> AppResult<()> {
        let path = self.workspace.ensure_project_path(project_path)?;
        if path.exists() {
            std::fs::remove_file(path)?;
        }
        Ok(())
    }

    fn scan_dir(&self, dir: &Path, projects: &mut Vec<WorkspaceProjectSummary>) -> AppResult<()> {
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                let name = path
                    .file_name()
                    .and_then(|value| value.to_str())
                    .unwrap_or("");
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

    pub(crate) fn read_project_file(&self, path: &Path) -> AppResult<ProjectData> {
        let raw = std::fs::read_to_string(path)?;
        self.format.deserialize(&raw)
    }

    pub(crate) fn write_project_file(&self, path: &Path, data: &ProjectData) -> AppResult<()> {
        let raw = self.format.serialize(data)?;
        std::fs::write(path, raw)?;
        Ok(())
    }

    pub(crate) fn summary_from_data(
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

    pub(crate) fn allocate_project_path(&self, base_dir: &Path, name: &str) -> PathBuf {
        allocate_unique_path(base_dir, &format!("{}.on", sanitize_file_name(name)))
    }

    pub(crate) fn target_path_for_project(
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::application::{CurrentWorkspace, FileService};
    use crate::db::Database;
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
        let workspace_dir = unique_test_dir("project-service");
        let db_path = workspace_dir.join("state.db");
        fs::create_dir_all(&workspace_dir).unwrap();

        let db = Database::new(db_path.to_str().unwrap()).unwrap();
        let current_workspace = CurrentWorkspace::default();

        // Construct one WorkspaceService and share it by reference
        let workspace_service = WorkspaceService::new(&current_workspace);
        let project_service = ProjectService::new(&workspace_service);
        let file_service = FileService::new(&workspace_service);

        workspace_service
            .open_workspace(&db, workspace_dir.to_str().unwrap())
            .unwrap();
        file_service.create_folder("folder").unwrap();

        let created = project_service
            .create_project("nested-note", "desc", Some("folder"))
            .unwrap();
        let created_path = PathBuf::from(&created.path);
        assert!(created_path.ends_with(Path::new("folder").join("nested-note.on")));
        assert!(created_path.exists());

        let mut loaded = project_service.load_project(&created.path).unwrap();
        loaded.data.description = "updated".into();

        let saved = project_service
            .save_project(&created.path, &loaded.data)
            .unwrap();
        let saved_path = PathBuf::from(&saved.path);
        let root_path = workspace_dir.join("nested-note.on");
        let canonical_saved = fs::canonicalize(&saved_path).unwrap();
        let canonical_created = fs::canonicalize(&created_path).unwrap();

        assert_eq!(canonical_saved, canonical_created);
        assert!(saved_path.exists());
        assert!(!root_path.exists());

        let projects = project_service.scan_workspace().unwrap();
        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].path, created.path);

        let saved_data: ProjectData = project_service.read_project_file(&saved_path).unwrap();
        assert_eq!(saved_data.description, "updated");

        drop(file_service);
        drop(project_service);
        drop(workspace_service);
        drop(current_workspace);
        drop(db);
        fs::remove_dir_all(&workspace_dir).unwrap();
    }
}

