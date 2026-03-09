use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Content {
    pub id: String,
    pub project_id: String,
    pub content_type: String,
    pub value_text: Option<String>,
    pub value_number: Option<f64>,
    pub config: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeContentRel {
    pub node_id: String,
    pub content_id: String,
    pub sort_order: i64,
    pub rel_x: f64,
    pub rel_y: f64,
}
