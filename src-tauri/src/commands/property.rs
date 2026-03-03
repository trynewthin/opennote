use tauri::State;
use crate::db::Database;
use crate::models::Property;

#[tauri::command]
pub fn set_property(
    db: State<Database>,
    node_id: String,
    prop_type: String,
    prop_key: String,
    value_text: Option<String>,
    value_number: Option<f64>,
    sort_order: Option<i64>,
) -> Result<Property, String> {
    db.set_property(
        &node_id, &prop_type, &prop_key,
        value_text.as_deref(), value_number,
        sort_order.unwrap_or(0),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_properties(db: State<Database>, node_id: String) -> Result<Vec<Property>, String> {
    db.get_properties(&node_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_property(db: State<Database>, id: String) -> Result<(), String> {
    db.delete_property(&id).map_err(|e| e.to_string())
}
