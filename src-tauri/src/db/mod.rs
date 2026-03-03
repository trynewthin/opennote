mod connection;
mod project;
mod note;
mod link;
mod group;
mod property;

pub use connection::Database;

use crate::models::GraphData;
use rusqlite::Result;

impl Database {
    /// 获取一个项目指定层级的完整图谱数据
    pub fn get_graph_data(&self, project_id: &str, parent_id: Option<&str>) -> Result<GraphData> {
        let notes = self.get_notes_by_parent(project_id, parent_id)?;
        let node_ids: Vec<String> = notes.iter().map(|n| n.id.clone()).collect();

        // 只获取当前层级节点相关的关联
        let all_links = self.get_links_by_project(project_id)?;
        let links: Vec<_> = all_links.into_iter().filter(|l| {
            node_ids.contains(&l.source_id) || node_ids.contains(&l.target_id)
        }).collect();

        let properties = self.get_properties_by_nodes(&node_ids)?;
        let groups = self.get_groups_by_project(project_id)?;
        let group_members = self.get_group_members_by_project(project_id)?;

        Ok(GraphData { notes, links, properties, groups, group_members })
    }
}
