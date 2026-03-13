use crate::application::{CurrentWorkspace, WorkspaceService};
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::format::ProjectData;
use crate::models::{LoadedProject, WorkspaceProjectSummary};
use tauri::State;

#[tauri::command]
pub fn open_workspace(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    path: String,
) -> CommandResult<Vec<WorkspaceProjectSummary>> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner()).open_workspace(&path),
    )
}

#[tauri::command]
pub fn list_projects(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
) -> CommandResult<Vec<WorkspaceProjectSummary>> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner()).list_projects(),
    )
}

#[tauri::command]
pub fn load_project(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    project_path: String,
) -> CommandResult<LoadedProject> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner()).load_project(&project_path),
    )
}

#[tauri::command]
pub fn save_project(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    project_path: String,
    data: ProjectData,
) -> CommandResult<WorkspaceProjectSummary> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner())
            .save_project(&project_path, &data),
    )
}

#[tauri::command]
pub fn create_project(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    name: String,
    description: String,
) -> CommandResult<WorkspaceProjectSummary> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner())
            .create_project(&name, &description),
    )
}

#[tauri::command]
pub fn delete_project(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    project_path: String,
) -> CommandResult<()> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner()).delete_project(&project_path),
    )
}

#[tauri::command]
pub fn copy_attachment(
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    project_path: String,
    source_path: String,
) -> CommandResult<String> {
    into_command_result(
        WorkspaceService::new(db.inner(), current_workspace.inner())
            .copy_attachment(&project_path, &source_path),
    )
}
