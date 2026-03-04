use tauri::State;
use crate::db::Database;
use crate::models::{Node, GraphData};

#[tauri::command]
pub fn get_graph_data(db: State<Database>, project_id: String) -> Result<GraphData, String> {
    db.get_graph_data(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_node(
    db: State<Database>,
    project_id: String,
    title: String,
    x: f64,
    y: f64,
) -> Result<Node, String> {
    db.create_node(&project_id, &title, x, y)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_node(db: State<Database>, id: String, title: String) -> Result<Node, String> {
    db.update_node(&id, &title).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_node_position(db: State<Database>, id: String, x: f64, y: f64) -> Result<(), String> {
    db.update_node_position(&id, x, y).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_node(db: State<Database>, id: String) -> Result<(), String> {
    db.delete_node(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_nodes(db: State<Database>, project_id: String, query: String) -> Result<Vec<Node>, String> {
    db.search_nodes(&project_id, &query).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn batch_delete_nodes(db: State<Database>, ids: Vec<String>) -> Result<(), String> {
    db.batch_delete_nodes(&ids).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_node_config(db: State<Database>, id: String, config: Option<String>) -> Result<(), String> {
    db.update_node_config(&id, config.as_deref()).map_err(|e| e.to_string())
}
