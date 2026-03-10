use crate::application::{GraphService, NodeService};
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::models::{GraphData, Node, NodeResourceMetadata};
use tauri::State;

#[tauri::command]
pub fn get_graph_data(db: State<Database>, project_id: String) -> CommandResult<GraphData> {
    into_command_result(GraphService::new(db.inner()).get_project_graph(&project_id))
}

#[tauri::command]
pub fn create_node(
    db: State<Database>,
    project_id: String,
    node_type: String,
    content: String,
    x: f64,
    y: f64,
) -> CommandResult<Node> {
    into_command_result(NodeService::new(db.inner()).create(
        &project_id,
        &node_type,
        &content,
        x,
        y,
    ))
}

#[tauri::command]
pub fn update_node(
    db: State<Database>,
    id: String,
    node_type: String,
    content: String,
) -> CommandResult<Node> {
    into_command_result(NodeService::new(db.inner()).update(&id, &node_type, &content))
}

#[tauri::command]
pub fn update_node_position(db: State<Database>, id: String, x: f64, y: f64) -> CommandResult<()> {
    into_command_result(NodeService::new(db.inner()).update_position(&id, x, y))
}

#[tauri::command]
pub fn delete_node(db: State<Database>, id: String) -> CommandResult<()> {
    into_command_result(NodeService::new(db.inner()).delete(&id))
}

#[tauri::command]
pub fn search_nodes(
    db: State<Database>,
    project_id: String,
    query: String,
) -> CommandResult<Vec<Node>> {
    into_command_result(NodeService::new(db.inner()).search(&project_id, &query))
}

#[tauri::command]
pub fn batch_delete_nodes(db: State<Database>, ids: Vec<String>) -> CommandResult<()> {
    into_command_result(NodeService::new(db.inner()).batch_delete(&ids))
}

#[tauri::command]
pub fn update_node_view_config(
    db: State<Database>,
    id: String,
    config: Option<String>,
) -> CommandResult<()> {
    into_command_result(NodeService::new(db.inner()).update_view_config(&id, config.as_deref()))
}

#[tauri::command]
pub fn update_node_semantic_config(
    db: State<Database>,
    id: String,
    config: Option<String>,
) -> CommandResult<()> {
    into_command_result(NodeService::new(db.inner()).update_semantic_config(&id, config.as_deref()))
}

#[tauri::command]
pub fn get_node_resource_metadata(
    db: State<Database>,
    node_id: String,
) -> CommandResult<NodeResourceMetadata> {
    into_command_result(NodeService::new(db.inner()).get_resource_metadata(&node_id))
}
