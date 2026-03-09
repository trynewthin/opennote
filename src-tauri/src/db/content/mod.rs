mod content_rel_repository;
mod content_repository;
mod mapper;

use crate::db::Database;
use crate::models::{Content, NodeContentRel};
use rusqlite::Result;

impl Database {
    pub fn create_content(
        &self,
        project_id: &str,
        content_type: &str,
        value_text: Option<&str>,
        value_number: Option<f64>,
    ) -> Result<Content> {
        let conn = self.conn.lock().unwrap();
        content_repository::create(&conn, project_id, content_type, value_text, value_number)
    }

    pub fn update_content(
        &self,
        id: &str,
        content_type: &str,
        value_text: Option<&str>,
        value_number: Option<f64>,
    ) -> Result<Content> {
        let conn = self.conn.lock().unwrap();
        content_repository::update(&conn, id, content_type, value_text, value_number)
    }

    pub fn update_content_config(&self, id: &str, config: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        content_repository::update_config(&conn, id, config)
    }

    pub fn delete_content(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        content_repository::delete(&conn, id)
    }

    pub fn get_contents_by_project(&self, project_id: &str) -> Result<Vec<Content>> {
        let conn = self.conn.lock().unwrap();
        content_repository::list_by_project(&conn, project_id)
    }

    pub fn add_content_to_node(
        &self,
        node_id: &str,
        content_id: &str,
        sort_order: i64,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        content_rel_repository::attach_to_node(&conn, node_id, content_id, sort_order)
    }

    pub fn remove_content_from_node(&self, node_id: &str, content_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        content_rel_repository::detach_from_node(&conn, node_id, content_id)
    }

    pub fn get_node_content_rels(&self, node_ids: &[String]) -> Result<Vec<NodeContentRel>> {
        let conn = self.conn.lock().unwrap();
        content_rel_repository::list_for_nodes(&conn, node_ids)
    }

    pub fn update_content_rel_position(
        &self,
        node_id: &str,
        content_id: &str,
        rel_x: f64,
        rel_y: f64,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        content_rel_repository::update_position(&conn, node_id, content_id, rel_x, rel_y)
    }
}
