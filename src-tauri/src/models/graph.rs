use super::{Content, Group, GroupMember, Link, Node, NodeContentRel};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphData {
    pub nodes: Vec<Node>,
    pub links: Vec<Link>,
    pub contents: Vec<Content>,
    pub node_content_rels: Vec<NodeContentRel>,
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
