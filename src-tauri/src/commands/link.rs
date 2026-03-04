use tauri::State;
use crate::db::Database;
use crate::models::Link;

#[tauri::command]
pub fn create_link(
    db: State<Database>,
    project_id: String,
    source_id: String,
    target_id: String,
    label: Option<String>,
    direction: Option<String>,
    link_type: Option<String>,
    weight: Option<f64>,
    sort_order: Option<i64>,
) -> Result<Link, String> {
    db.create_link(
        &project_id,
        &source_id,
        &target_id,
        label.as_deref(),
        &direction.unwrap_or_else(|| "none".to_string()),
        &link_type.unwrap_or_else(|| "related".to_string()),
        weight.unwrap_or(0.5),
        sort_order.unwrap_or(0),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_link(
    db: State<Database>,
    id: String,
    label: Option<String>,
    direction: String,
    link_type: String,
    weight: f64,
    sort_order: i64,
) -> Result<Link, String> {
    db.update_link(&id, label.as_deref(), &direction, &link_type, weight, sort_order)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_link(db: State<Database>, id: String) -> Result<(), String> {
    db.delete_link(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_link_config(db: State<Database>, id: String, config: Option<String>) -> Result<(), String> {
    db.update_link_config(&id, config.as_deref()).map_err(|e| e.to_string())
}
