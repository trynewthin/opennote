use crate::application::{CreateProjectRequestCache, CurrentWorkspace, NodeService};
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::format::is_text_mime;
use crate::models::{FileContent, NodeResourceMetadata};
use tauri::State;

#[tauri::command]
pub fn get_node_resource_metadata(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    project_path: String,
    node_id: String,
) -> CommandResult<NodeResourceMetadata> {
    into_command_result(
        NodeService::new(
            db.inner(),
            current_workspace.inner(),
            create_request_cache.inner(),
        )
        .get_resource_metadata(&project_path, &node_id),
    )
}

#[tauri::command]
pub fn read_node_file(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    project_path: String,
    node_id: String,
) -> CommandResult<FileContent> {
    use crate::error::AppError;

    into_command_result((|| -> crate::application::AppResult<FileContent> {
        let meta = NodeService::new(
            db.inner(),
            current_workspace.inner(),
            create_request_cache.inner(),
        )
        .get_resource_metadata(&project_path, &node_id)?;
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
