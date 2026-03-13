use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub language: Option<String>,
    pub theme: Option<String>,
    pub recent_workspaces: Vec<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: None,
            theme: None,
            recent_workspaces: Vec::new(),
        }
    }
}
