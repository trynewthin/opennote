use crate::application::{CreateProjectRequestCache, CurrentWorkspace, WorkspaceService};
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::format::ProjectData;
use crate::models::{LoadedProject, WorkspaceProjectSummary};
use tauri::State;

#[tauri::command]
pub fn open_workspace(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    path: String,
) -> CommandResult<Vec<WorkspaceProjectSummary>> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .open_workspace(&path),
    )
}

#[tauri::command]
pub fn list_projects(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
) -> CommandResult<Vec<WorkspaceProjectSummary>> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .list_projects(),
    )
}

#[tauri::command]
pub fn load_project(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    project_path: String,
) -> CommandResult<LoadedProject> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .load_project(&project_path),
    )
}

#[tauri::command]
pub fn save_project(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    project_path: String,
    data: ProjectData,
) -> CommandResult<WorkspaceProjectSummary> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .save_project(&project_path, &data),
    )
}

#[tauri::command]
pub fn create_project(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    name: String,
    description: String,
    folder_path: Option<String>,
    request_id: Option<String>,
) -> CommandResult<WorkspaceProjectSummary> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .create_project(&name, &description, folder_path.as_deref(), request_id.as_deref()),
    )
}

#[tauri::command]
pub fn delete_project(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    project_path: String,
) -> CommandResult<()> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .delete_project(&project_path),
    )
}

#[tauri::command]
pub fn copy_attachment(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    project_path: String,
    source_path: String,
) -> CommandResult<String> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .copy_attachment(&project_path, &source_path),
    )
}

#[tauri::command]
pub fn create_workspace_folder(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    folder_path: String,
) -> CommandResult<()> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .create_folder(&folder_path),
    )
}

#[tauri::command]
pub fn list_workspace_folders(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
) -> CommandResult<Vec<String>> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .list_folders(),
    )
}

#[tauri::command]
pub fn list_workspace_tree(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
) -> CommandResult<Vec<crate::models::WorkspaceFileEntry>> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .scan_all_files(),
    )
}

#[tauri::command]
pub fn rename_file(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    path: String,
    new_name: String,
) -> CommandResult<String> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .rename_file(&path, &new_name),
    )
}

#[tauri::command]
pub fn delete_file(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    path: String,
) -> CommandResult<()> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner(), create_request_cache.inner())
            .delete_file(&path),
    )
}

#[tauri::command]
pub fn read_file_by_path(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    create_request_cache: State<CreateProjectRequestCache>,
    path: String,
) -> CommandResult<crate::commands::node::FileContent> {
    use crate::commands::node::FileContent;

    into_command_result((|| -> crate::application::AppResult<FileContent> {
        let service = WorkspaceService::new(
            db.inner(),
            current_workspace.inner(),
            create_request_cache.inner(),
        );
        let resolved = service.ensure_within_workspace(&path)?;
        let file_name = resolved
            .file_name()
            .and_then(|n| n.to_str())
            .map(String::from);
        let mime = mime_guess::from_path(&resolved)
            .first_or_octet_stream()
            .essence_str()
            .to_string();

        let is_text = mime.starts_with("text/")
            || mime == "application/json"
            || mime == "application/javascript"
            || mime == "application/xml"
            || mime == "application/x-yaml"
            || mime == "application/toml";

        if is_text {
            let text = std::fs::read_to_string(&resolved)?;
            Ok(FileContent {
                encoding: "text".into(),
                data: text,
                mime_type: Some(mime),
                file_name,
            })
        } else {
            use base64::Engine;
            let bytes = std::fs::read(&resolved)?;
            let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
            Ok(FileContent {
                encoding: "base64".into(),
                data: b64,
                mime_type: Some(mime),
                file_name,
            })
        }
    })())
}
