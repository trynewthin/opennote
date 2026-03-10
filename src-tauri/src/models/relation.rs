use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relation {
    pub id: String,
    pub project_id: String,
    pub source_id: String,
    pub target_id: String,
    pub relation_type: String,
    pub content: Option<String>,
    pub semantic_config: Option<String>,
    pub view_config: Option<String>,
    pub created_at: i64,
}
