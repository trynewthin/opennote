use std::path::{Path, PathBuf};

use super::utils::allocate_unique_path;
use crate::application::{AppResult, WorkspaceService};
use crate::error::AppError;
use crate::format::{PathResolver, RelativePathResolver};

pub struct AttachmentService<'a> {
    workspace: &'a WorkspaceService<'a>,
    path_resolver: Box<dyn PathResolver>,
}

impl<'a> AttachmentService<'a> {
    pub fn new(workspace: &'a WorkspaceService<'a>) -> Self {
        Self {
            workspace,
            path_resolver: Box::<RelativePathResolver>::default(),
        }
    }

    pub fn copy_attachment(&self, project_path: &str, source_path: &str) -> AppResult<String> {
        let project_file = self.workspace.ensure_project_path(project_path)?;
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
}
