use crate::db::Database;
use crate::models::Project;
use tauri::State;

#[tauri::command]
pub fn get_all_projects(db: State<Database>) -> Result<Vec<Project>, String> {
    db.get_all_projects().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_project(
    db: State<Database>,
    name: String,
    description: String,
) -> Result<Project, String> {
    db.create_project(&name, &description)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_project(
    db: State<Database>,
    id: String,
    name: String,
    description: String,
) -> Result<Project, String> {
    db.update_project(&id, &name, &description)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_project(db: State<Database>, id: String) -> Result<(), String> {
    db.delete_project(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_project_node_count(db: State<Database>, project_id: String) -> Result<i64, String> {
    db.get_project_node_count(&project_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_project_config(
    db: State<Database>,
    id: String,
    config: Option<String>,
) -> Result<(), String> {
    db.update_project_config(&id, config.as_deref())
        .map_err(|e| e.to_string())
}
