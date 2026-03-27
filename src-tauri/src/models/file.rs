use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileContent {
    pub encoding: String,
    pub data: String,
    pub mime_type: Option<String>,
    pub file_name: Option<String>,
}
