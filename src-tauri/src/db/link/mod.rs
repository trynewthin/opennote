mod link_repository;
mod mapper;

use crate::db::Database;
use crate::models::Link;
use rusqlite::Result;

impl Database {
    pub fn create_link(
        &self,
        project_id: &str,
        source_id: &str,
        target_id: &str,
        label: Option<&str>,
        direction: &str,
        link_type: &str,
        weight: f64,
        sort_order: i64,
    ) -> Result<Link> {
        let conn = self.conn.lock().unwrap();
        link_repository::create(
            &conn, project_id, source_id, target_id, label, direction, link_type, weight,
            sort_order,
        )
    }

    pub fn update_link(
        &self,
        id: &str,
        label: Option<&str>,
        direction: &str,
        link_type: &str,
        weight: f64,
        sort_order: i64,
    ) -> Result<Link> {
        let conn = self.conn.lock().unwrap();
        link_repository::update(&conn, id, label, direction, link_type, weight, sort_order)
    }

    pub fn update_link_config(&self, id: &str, config: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        link_repository::update_config(&conn, id, config)
    }

    pub fn delete_link(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        link_repository::delete(&conn, id)
    }

    pub fn get_links_by_project(&self, project_id: &str) -> Result<Vec<Link>> {
        let conn = self.conn.lock().unwrap();
        link_repository::list_by_project(&conn, project_id)
    }
}
