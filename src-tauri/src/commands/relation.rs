use crate::application::RelationService;
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::models::Relation;
use tauri::State;

#[tauri::command]
pub fn create_relation(
    db: State<Database>,
    project_id: String,
    source_id: String,
    target_id: String,
    relation_type: String,
    content: Option<String>,
    semantic_config: Option<String>,
    view_config: Option<String>,
) -> CommandResult<Relation> {
    into_command_result(RelationService::new(db.inner()).create(
        &project_id,
        &source_id,
        &target_id,
        &relation_type,
        content.as_deref(),
        semantic_config.as_deref(),
        view_config.as_deref(),
    ))
}

#[tauri::command]
pub fn update_relation(
    db: State<Database>,
    id: String,
    relation_type: String,
    content: Option<String>,
    semantic_config: Option<String>,
    view_config: Option<String>,
) -> CommandResult<Relation> {
    into_command_result(RelationService::new(db.inner()).update(
        &id,
        &relation_type,
        content.as_deref(),
        semantic_config.as_deref(),
        view_config.as_deref(),
    ))
}

#[tauri::command]
pub fn delete_relation(db: State<Database>, id: String) -> CommandResult<()> {
    into_command_result(RelationService::new(db.inner()).delete(&id))
}

#[tauri::command]
pub fn update_relation_view_config(
    db: State<Database>,
    id: String,
    config: Option<String>,
) -> CommandResult<()> {
    into_command_result(RelationService::new(db.inner()).update_view_config(&id, config.as_deref()))
}

#[tauri::command]
pub fn update_relation_semantic_config(
    db: State<Database>,
    id: String,
    config: Option<String>,
) -> CommandResult<()> {
    into_command_result(
        RelationService::new(db.inner()).update_semantic_config(&id, config.as_deref()),
    )
}
