use crate::application::AppResult;
use crate::db::Database;
use crate::models::Node;

pub struct NodeService<'a> {
    db: &'a Database,
}

impl<'a> NodeService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(&self, project_id: &str, title: &str, x: f64, y: f64) -> AppResult<Node> {
        self.db
            .create_node(project_id, title, x, y)
            .map_err(Into::into)
    }

    pub fn update(&self, id: &str, title: &str) -> AppResult<Node> {
        self.db.update_node(id, title).map_err(Into::into)
    }

    pub fn update_position(&self, id: &str, x: f64, y: f64) -> AppResult<()> {
        self.db.update_node_position(id, x, y).map_err(Into::into)
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        self.db.delete_node(id).map_err(Into::into)
    }

    pub fn search(&self, project_id: &str, query: &str) -> AppResult<Vec<Node>> {
        self.db.search_nodes(project_id, query).map_err(Into::into)
    }

    pub fn batch_delete(&self, ids: &[String]) -> AppResult<()> {
        self.db.batch_delete_nodes(ids).map_err(Into::into)
    }

    pub fn update_config(&self, id: &str, config: Option<&str>) -> AppResult<()> {
        self.db.update_node_config(id, config).map_err(Into::into)
    }
}
