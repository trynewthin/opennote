use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeResourceMetadata {
    pub node_id: String,
    pub resolved_path: Option<String>,
    pub display_name: Option<String>,
    pub exists: bool,
    pub mime_type: Option<String>,
    pub size_bytes: Option<u64>,
}
