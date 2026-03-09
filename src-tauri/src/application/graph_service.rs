use crate::application::AppResult;
use crate::db::Database;
use crate::models::GraphData;

pub struct GraphService<'a> {
    db: &'a Database,
}

impl<'a> GraphService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn get_project_graph(&self, project_id: &str) -> AppResult<GraphData> {
        let nodes = self.db.get_all_nodes_in_project(project_id)?;
        let node_ids: Vec<String> = nodes.iter().map(|node| node.id.clone()).collect();

        let links = self.db.get_links_by_project(project_id)?;
        let contents = self.db.get_contents_by_project(project_id)?;
        let node_content_rels = self.db.get_node_content_rels(&node_ids)?;
        let groups = self.db.get_groups_by_project(project_id)?;
        let group_members = self.db.get_group_members_by_project(project_id)?;

        Ok(GraphData {
            nodes,
            links,
            contents,
            node_content_rels,
            groups,
            group_members,
        })
    }
}
