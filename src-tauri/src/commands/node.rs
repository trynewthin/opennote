use tauri::State;

use crate::application::{CurrentWorkspace, NodeService, WorkspaceService};
use crate::commands::{into_command_result, CommandResult};
use crate::format::is_text_mime;
use crate::models::{FileContent, NodeResourceMetadata};

#[tauri::command]
pub fn get_node_resource_metadata(
    current_workspace: State<CurrentWorkspace>,
    project_path: String,
    node_id: String,
) -> CommandResult<NodeResourceMetadata> {
    let ws = WorkspaceService::new(current_workspace.inner());
    into_command_result(
        NodeService::new(&ws).get_resource_metadata(&project_path, &node_id),
    )
}

#[tauri::command]
pub fn read_node_file(
    current_workspace: State<CurrentWorkspace>,
    project_path: String,
    node_id: String,
) -> CommandResult<FileContent> {
    use crate::error::AppError;

    into_command_result((|| -> crate::application::AppResult<FileContent> {
        let ws = WorkspaceService::new(current_workspace.inner());
        let meta = NodeService::new(&ws).get_resource_metadata(&project_path, &node_id)?;
        let path = meta
            .resolved_path
            .as_deref()
            .ok_or_else(|| AppError::NotFound("No resolved path for node".into()))?;

        let mime = meta.mime_type.clone().unwrap_or_default();
        if is_text_mime(&mime) {
            let text = std::fs::read_to_string(path)?;
            Ok(FileContent {
                encoding: "text".into(),
                data: text,
                mime_type: meta.mime_type,
                file_name: meta.display_name,
            })
        } else {
            use base64::Engine;
            let bytes = std::fs::read(path)?;
            let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
            Ok(FileContent {
                encoding: "base64".into(),
                data: b64,
                mime_type: meta.mime_type,
                file_name: meta.display_name,
            })
        }
    })())
}
