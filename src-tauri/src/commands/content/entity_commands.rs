use crate::application::ContentService;
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::models::Content;
use tauri::State;

#[tauri::command]
pub fn create_content(
    db: State<Database>,
    project_id: String,
    content_type: String,
    value_text: Option<String>,
    value_number: Option<f64>,
) -> CommandResult<Content> {
    into_command_result(ContentService::new(db.inner()).create(
        &project_id,
        &content_type,
        value_text.as_deref(),
        value_number,
    ))
}

#[tauri::command]
pub fn update_content(
    db: State<Database>,
    id: String,
    content_type: String,
    value_text: Option<String>,
    value_number: Option<f64>,
) -> CommandResult<Content> {
    into_command_result(ContentService::new(db.inner()).update(
        &id,
        &content_type,
        value_text.as_deref(),
        value_number,
    ))
}

#[tauri::command]
pub fn delete_content(db: State<Database>, id: String) -> CommandResult<()> {
    into_command_result(ContentService::new(db.inner()).delete(&id))
}

#[tauri::command]
pub fn get_contents_by_project(
    db: State<Database>,
    project_id: String,
) -> CommandResult<Vec<Content>> {
    into_command_result(ContentService::new(db.inner()).list_by_project(&project_id))
}

#[tauri::command]
pub fn update_content_config(
    db: State<Database>,
    id: String,
    config: Option<String>,
) -> CommandResult<()> {
    into_command_result(ContentService::new(db.inner()).update_config(&id, config.as_deref()))
}
