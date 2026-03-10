mod mapper;
mod relation_repository;

use crate::db::Database;
use crate::models::Relation;
use rusqlite::Result;

impl Database {
    #[allow(clippy::too_many_arguments)]
    pub fn create_relation(
        &self,
        project_id: &str,
        source_id: &str,
        target_id: &str,
        relation_type: &str,
        content: Option<&str>,
        semantic_config: Option<&str>,
        view_config: Option<&str>,
    ) -> Result<Relation> {
        let conn = self.conn.lock().unwrap();
        relation_repository::create(
            &conn,
            project_id,
            source_id,
            target_id,
            relation_type,
            content,
            semantic_config,
            view_config,
        )
    }

    pub fn update_relation(
        &self,
        id: &str,
        relation_type: &str,
        content: Option<&str>,
        semantic_config: Option<&str>,
        view_config: Option<&str>,
    ) -> Result<Relation> {
        let conn = self.conn.lock().unwrap();
        relation_repository::update(
            &conn,
            id,
            relation_type,
            content,
            semantic_config,
            view_config,
        )
    }

    pub fn update_relation_view_config(&self, id: &str, config: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        relation_repository::update_view_config(&conn, id, config)
    }

    pub fn update_relation_semantic_config(&self, id: &str, config: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        relation_repository::update_semantic_config(&conn, id, config)
    }

    pub fn delete_relation(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        relation_repository::delete(&conn, id)
    }

    pub fn get_relations_by_project(&self, project_id: &str) -> Result<Vec<Relation>> {
        let conn = self.conn.lock().unwrap();
        relation_repository::list_by_project(&conn, project_id)
    }
}
