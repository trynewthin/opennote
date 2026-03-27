use serde::{Deserialize, Serialize};

use crate::format::ProjectData;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceProjectSummary {
    pub path: String,
    pub name: String,
    pub description: String,
    pub updated_at: i64,
    pub node_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoadedProject {
    pub path: String,
    pub data: ProjectData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceFileEntry {
    pub path: String,
    pub name: String,
    pub kind: String, // "file" | "directory"
    pub children: Vec<WorkspaceFileEntry>,
}
