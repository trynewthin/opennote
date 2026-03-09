use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub config: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}
