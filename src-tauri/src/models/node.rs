use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    pub project_id: String,
    pub node_type: String,
    pub content: String,
    pub semantic_config: Option<String>,
    pub view_config: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeResourceMetadata {
    pub node_id: String,
    pub resolved_path: Option<String>,
    pub display_name: Option<String>,
    pub exists: bool,
    pub mime_type: Option<String>,
    pub size_bytes: Option<u64>,
}
