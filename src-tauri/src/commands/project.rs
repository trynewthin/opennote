use crate::application::ProjectService;
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::models::Project;
use tauri::State;

#[tauri::command]
pub fn get_all_projects(db: State<Database>) -> CommandResult<Vec<Project>> {
    into_command_result(ProjectService::new(db.inner()).list())
}

#[tauri::command]
pub fn create_project(
    db: State<Database>,
    name: String,
    description: String,
) -> CommandResult<Project> {
    into_command_result(ProjectService::new(db.inner()).create(&name, &description))
}

#[tauri::command]
pub fn update_project(
    db: State<Database>,
    id: String,
    name: String,
    description: String,
) -> CommandResult<Project> {
    into_command_result(ProjectService::new(db.inner()).update(&id, &name, &description))
}

#[tauri::command]
pub fn delete_project(db: State<Database>, id: String) -> CommandResult<()> {
    into_command_result(ProjectService::new(db.inner()).delete(&id))
}

#[tauri::command]
pub fn get_project_node_count(db: State<Database>, project_id: String) -> CommandResult<i64> {
    into_command_result(ProjectService::new(db.inner()).get_node_count(&project_id))
}

#[tauri::command]
pub fn update_project_config(
    db: State<Database>,
    id: String,
    config: Option<String>,
) -> CommandResult<()> {
    into_command_result(ProjectService::new(db.inner()).update_config(&id, config.as_deref()))
}
