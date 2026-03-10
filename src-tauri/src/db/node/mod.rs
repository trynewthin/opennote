mod mapper;
mod node_query_repository;
mod node_write_repository;

use crate::db::Database;
use crate::models::Node;
use rusqlite::Result;

impl Database {
    pub fn create_node(
        &self,
        project_id: &str,
        node_type: &str,
        content: &str,
        x: f64,
        y: f64,
    ) -> Result<Node> {
        let conn = self.conn.lock().unwrap();
        node_write_repository::create(&conn, project_id, node_type, content, x, y)
    }

    pub fn update_node(&self, id: &str, node_type: &str, content: &str) -> Result<Node> {
        let conn = self.conn.lock().unwrap();
        node_write_repository::update(&conn, id, node_type, content)
    }

    pub fn update_node_position(&self, id: &str, x: f64, y: f64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        node_write_repository::update_position(&conn, id, x, y)
    }

    pub fn update_node_view_config(&self, id: &str, config: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        node_write_repository::update_view_config(&conn, id, config)
    }

    pub fn update_node_semantic_config(&self, id: &str, config: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        node_write_repository::update_semantic_config(&conn, id, config)
    }

    pub fn delete_node(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        node_write_repository::delete(&conn, id)
    }

    pub fn batch_delete_nodes(&self, ids: &[String]) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        node_write_repository::batch_delete(&conn, ids)
    }

    pub fn get_all_nodes_in_project(&self, project_id: &str) -> Result<Vec<Node>> {
        let conn = self.conn.lock().unwrap();
        node_query_repository::list_by_project(&conn, project_id)
    }

    pub fn get_node(&self, id: &str) -> Result<Option<Node>> {
        let conn = self.conn.lock().unwrap();
        node_query_repository::get_by_id(&conn, id)
    }

    pub fn search_nodes(&self, project_id: &str, query: &str) -> Result<Vec<Node>> {
        let conn = self.conn.lock().unwrap();
        node_query_repository::search(&conn, project_id, query)
    }
}
