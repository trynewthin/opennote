use super::{Group, GroupMember, Node, Relation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphData {
    pub nodes: Vec<Node>,
    pub relations: Vec<Relation>,
    pub groups: Vec<Group>,
    pub group_members: Vec<GroupMember>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectExportMeta {
    pub name: String,
    pub description: String,
    pub config: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectExport {
    pub version: String,
    pub exported_at: String,
    pub project: ProjectExportMeta,
    pub graph: GraphData,
}
