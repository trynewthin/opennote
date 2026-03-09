use crate::application::GroupService;
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::models::Group;
use tauri::State;

#[tauri::command]
pub fn create_group(
    db: State<Database>,
    project_id: String,
    name: String,
    color: String,
) -> CommandResult<Group> {
    into_command_result(GroupService::new(db.inner()).create(&project_id, &name, &color))
}

#[tauri::command]
pub fn update_group(
    db: State<Database>,
    id: String,
    name: String,
    color: String,
) -> CommandResult<Group> {
    into_command_result(GroupService::new(db.inner()).update(&id, &name, &color))
}

#[tauri::command]
pub fn delete_group(db: State<Database>, id: String) -> CommandResult<()> {
    into_command_result(GroupService::new(db.inner()).delete(&id))
}

#[tauri::command]
pub fn add_node_to_group(
    db: State<Database>,
    group_id: String,
    node_id: String,
) -> CommandResult<()> {
    into_command_result(GroupService::new(db.inner()).add_node(&group_id, &node_id))
}

#[tauri::command]
pub fn remove_node_from_group(
    db: State<Database>,
    group_id: String,
    node_id: String,
) -> CommandResult<()> {
    into_command_result(GroupService::new(db.inner()).remove_node(&group_id, &node_id))
}
