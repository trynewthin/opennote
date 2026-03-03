use tauri::State;
use crate::db::Database;
use crate::models::{Note, GraphData};

#[tauri::command]
pub fn get_graph_data(db: State<Database>, project_id: String, parent_id: Option<String>) -> Result<GraphData, String> {
    db.get_graph_data(&project_id, parent_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_note(
    db: State<Database>,
    project_id: String,
    parent_id: Option<String>,
    title: String,
    x: f64,
    y: f64,
) -> Result<Note, String> {
    db.create_note(&project_id, parent_id.as_deref(), &title, x, y)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_note(db: State<Database>, id: String, title: String) -> Result<Note, String> {
    db.update_note(&id, &title).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_note_position(db: State<Database>, id: String, x: f64, y: f64) -> Result<(), String> {
    db.update_note_position(&id, x, y).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_note(db: State<Database>, id: String) -> Result<(), String> {
    db.delete_note(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_notes(db: State<Database>, project_id: String, query: String) -> Result<Vec<Note>, String> {
    db.search_notes(&project_id, &query).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_ancestors(db: State<Database>, node_id: String) -> Result<Vec<Note>, String> {
    db.get_ancestors(&node_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn move_note(db: State<Database>, id: String, new_parent_id: Option<String>) -> Result<Note, String> {
    db.move_note(&id, new_parent_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn batch_delete_notes(db: State<Database>, ids: Vec<String>) -> Result<(), String> {
    db.batch_delete_notes(&ids).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn batch_move_notes(db: State<Database>, ids: Vec<String>, new_parent_id: Option<String>) -> Result<(), String> {
    db.batch_move_notes(&ids, new_parent_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_children_counts(db: State<Database>, node_ids: Vec<String>) -> Result<Vec<(String, i64)>, String> {
    db.get_children_counts(&node_ids).map_err(|e| e.to_string())
}
