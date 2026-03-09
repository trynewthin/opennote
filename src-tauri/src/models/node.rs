use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub x: f64,
    pub y: f64,
    pub config: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}
