use crate::application::LinkService;
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::models::Link;
use tauri::State;

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
) -> CommandResult<Link> {
    let direction = direction.unwrap_or_else(|| "none".to_string());
    let link_type = link_type.unwrap_or_else(|| "related".to_string());

    into_command_result(LinkService::new(db.inner()).create(
        &project_id,
        &source_id,
        &target_id,
        label.as_deref(),
        &direction,
        &link_type,
        weight.unwrap_or(0.5),
        sort_order.unwrap_or(0),
    ))
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
) -> CommandResult<Link> {
    into_command_result(LinkService::new(db.inner()).update(
        &id,
        label.as_deref(),
        &direction,
        &link_type,
        weight,
        sort_order,
    ))
}

#[tauri::command]
pub fn delete_link(db: State<Database>, id: String) -> CommandResult<()> {
    into_command_result(LinkService::new(db.inner()).delete(&id))
}

#[tauri::command]
pub fn update_link_config(
    db: State<Database>,
    id: String,
    config: Option<String>,
) -> CommandResult<()> {
    into_command_result(LinkService::new(db.inner()).update_config(&id, config.as_deref()))
}
