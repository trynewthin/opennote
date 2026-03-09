use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Link {
    pub id: String,
    pub project_id: String,
    pub source_id: String,
    pub target_id: String,
    pub label: Option<String>,
    pub direction: String,
    pub link_type: String,
    pub weight: f64,
    pub sort_order: i64,
    pub config: Option<String>,
    pub created_at: i64,
}
