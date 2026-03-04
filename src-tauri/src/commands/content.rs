use tauri::State;
use crate::db::Database;
use crate::models::{Content, NodeContentRel};

#[tauri::command]
pub fn create_content(
    db: State<Database>,
    project_id: String,
    content_type: String,
    value_text: Option<String>,
    value_number: Option<f64>,
) -> Result<Content, String> {
    db.create_content(&project_id, &content_type, value_text.as_deref(), value_number)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_content(
    db: State<Database>,
    id: String,
    content_type: String,
    value_text: Option<String>,
    value_number: Option<f64>,
) -> Result<Content, String> {
    db.update_content(&id, &content_type, value_text.as_deref(), value_number)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_content(db: State<Database>, id: String) -> Result<(), String> {
    db.delete_content(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_contents_by_project(db: State<Database>, project_id: String) -> Result<Vec<Content>, String> {
    db.get_contents_by_project(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_content_to_node(
    db: State<Database>,
    node_id: String,
    content_id: String,
    sort_order: i64,
) -> Result<(), String> {
    db.add_content_to_node(&node_id, &content_id, sort_order).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_content_from_node(
    db: State<Database>,
    node_id: String,
    content_id: String,
) -> Result<(), String> {
    db.remove_content_from_node(&node_id, &content_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_node_content_rels(
    db: State<Database>,
    node_ids: Vec<String>,
) -> Result<Vec<NodeContentRel>, String> {
    db.get_node_content_rels(&node_ids).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_content_rel_position(
    db: State<Database>,
    node_id: String,
    content_id: String,
    rel_x: f64,
    rel_y: f64,
) -> Result<(), String> {
    db.update_content_rel_position(&node_id, &content_id, rel_x, rel_y).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_content_config(db: State<Database>, id: String, config: Option<String>) -> Result<(), String> {
    db.update_content_config(&id, config.as_deref()).map_err(|e| e.to_string())
}
