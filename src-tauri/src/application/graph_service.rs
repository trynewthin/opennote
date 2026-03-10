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
        let relations = self.db.get_relations_by_project(project_id)?;
        let groups = self.db.get_groups_by_project(project_id)?;
        let group_members = self.db.get_group_members_by_project(project_id)?;

        Ok(GraphData {
            nodes,
            relations,
            groups,
            group_members,
        })
    }
}
