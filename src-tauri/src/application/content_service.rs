use crate::application::AppResult;
use crate::db::Database;
use crate::models::{Content, NodeContentRel};

pub struct ContentService<'a> {
    db: &'a Database,
}

impl<'a> ContentService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(
        &self,
        project_id: &str,
        content_type: &str,
        value_text: Option<&str>,
        value_number: Option<f64>,
    ) -> AppResult<Content> {
        self.db
            .create_content(project_id, content_type, value_text, value_number)
            .map_err(Into::into)
    }

    pub fn update(
        &self,
        id: &str,
        content_type: &str,
        value_text: Option<&str>,
        value_number: Option<f64>,
    ) -> AppResult<Content> {
        self.db
            .update_content(id, content_type, value_text, value_number)
            .map_err(Into::into)
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        self.db.delete_content(id).map_err(Into::into)
    }

    pub fn list_by_project(&self, project_id: &str) -> AppResult<Vec<Content>> {
        self.db
            .get_contents_by_project(project_id)
            .map_err(Into::into)
    }

    pub fn attach_to_node(
        &self,
        node_id: &str,
        content_id: &str,
        sort_order: i64,
    ) -> AppResult<()> {
        self.db
            .add_content_to_node(node_id, content_id, sort_order)
            .map_err(Into::into)
    }

    pub fn detach_from_node(&self, node_id: &str, content_id: &str) -> AppResult<()> {
        self.db
            .remove_content_from_node(node_id, content_id)
            .map_err(Into::into)
    }

    pub fn list_node_rels(&self, node_ids: &[String]) -> AppResult<Vec<NodeContentRel>> {
        self.db.get_node_content_rels(node_ids).map_err(Into::into)
    }

    pub fn update_rel_position(
        &self,
        node_id: &str,
        content_id: &str,
        rel_x: f64,
        rel_y: f64,
    ) -> AppResult<()> {
        self.db
            .update_content_rel_position(node_id, content_id, rel_x, rel_y)
            .map_err(Into::into)
    }

    pub fn update_config(&self, id: &str, config: Option<&str>) -> AppResult<()> {
        self.db
            .update_content_config(id, config)
            .map_err(Into::into)
    }
}
