use crate::application::ContentService;
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::models::NodeContentRel;
use tauri::State;

#[tauri::command]
pub fn add_content_to_node(
    db: State<Database>,
    node_id: String,
    content_id: String,
    sort_order: i64,
) -> CommandResult<()> {
    into_command_result(ContentService::new(db.inner()).attach_to_node(
        &node_id,
        &content_id,
        sort_order,
    ))
}

#[tauri::command]
pub fn remove_content_from_node(
    db: State<Database>,
    node_id: String,
    content_id: String,
) -> CommandResult<()> {
    into_command_result(ContentService::new(db.inner()).detach_from_node(&node_id, &content_id))
}

#[tauri::command]
pub fn get_node_content_rels(
    db: State<Database>,
    node_ids: Vec<String>,
) -> CommandResult<Vec<NodeContentRel>> {
    into_command_result(ContentService::new(db.inner()).list_node_rels(&node_ids))
}

#[tauri::command]
pub fn update_content_rel_position(
    db: State<Database>,
    node_id: String,
    content_id: String,
    rel_x: f64,
    rel_y: f64,
) -> CommandResult<()> {
    into_command_result(ContentService::new(db.inner()).update_rel_position(
        &node_id,
        &content_id,
        rel_x,
        rel_y,
    ))
}
