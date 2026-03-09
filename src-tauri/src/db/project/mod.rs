mod mapper;
mod project_repository;

use crate::db::Database;
use crate::models::Project;
use rusqlite::Result;

impl Database {
    pub fn create_project(&self, name: &str, description: &str) -> Result<Project> {
        let conn = self.conn.lock().unwrap();
        project_repository::create(&conn, name, description)
    }

    pub fn update_project(&self, id: &str, name: &str, description: &str) -> Result<Project> {
        let conn = self.conn.lock().unwrap();
        project_repository::update(&conn, id, name, description)
    }

    pub fn update_project_config(&self, id: &str, config: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        project_repository::update_config(&conn, id, config)
    }

    pub fn delete_project(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        project_repository::delete(&conn, id)
    }

    pub fn get_all_projects(&self) -> Result<Vec<Project>> {
        let conn = self.conn.lock().unwrap();
        project_repository::list(&conn)
    }

    pub fn get_project_node_count(&self, project_id: &str) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        project_repository::get_node_count(&conn, project_id)
    }
}
