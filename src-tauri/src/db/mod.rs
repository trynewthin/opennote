mod connection;
mod project;
mod node;
mod link;
mod group;
mod content;
mod import_export;

pub use connection::Database;

use crate::models::GraphData;
use rusqlite::Result;

impl Database {
    /// 获取一个项目的完整图谱数据
    pub fn get_graph_data(&self, project_id: &str) -> Result<GraphData> {
        let nodes = self.get_all_nodes_in_project(project_id)?;
        let node_ids: Vec<String> = nodes.iter().map(|n| n.id.clone()).collect();

        let links = self.get_links_by_project(project_id)?;
        let contents = self.get_contents_by_project(project_id)?;
        let node_content_rels = self.get_node_content_rels(&node_ids)?;

        let groups = self.get_groups_by_project(project_id)?;
        let group_members = self.get_group_members_by_project(project_id)?;

        Ok(GraphData { nodes, links, contents, node_content_rels, groups, group_members })
    }
}
