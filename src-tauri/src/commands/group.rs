use crate::db::Database;
use crate::models::Group;
use tauri::State;

#[tauri::command]
pub fn create_group(
    db: State<Database>,
    project_id: String,
    name: String,
    color: String,
) -> Result<Group, String> {
    db.create_group(&project_id, &name, &color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_group(
    db: State<Database>,
    id: String,
    name: String,
    color: String,
) -> Result<Group, String> {
    db.update_group(&id, &name, &color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_group(db: State<Database>, id: String) -> Result<(), String> {
    db.delete_group(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_node_to_group(
    db: State<Database>,
    group_id: String,
    node_id: String,
) -> Result<(), String> {
    db.add_node_to_group(&group_id, &node_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_node_from_group(
    db: State<Database>,
    group_id: String,
    node_id: String,
) -> Result<(), String> {
    db.remove_node_from_group(&group_id, &node_id)
        .map_err(|e| e.to_string())
}
