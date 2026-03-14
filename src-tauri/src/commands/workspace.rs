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
