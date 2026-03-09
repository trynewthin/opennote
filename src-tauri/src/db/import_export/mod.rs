mod export_meta_repository;
mod graph_entity_import_steps;
mod graph_relationship_import_steps;
mod import_repository;

use crate::db::Database;
use crate::models::{ProjectExport, ProjectExportMeta};
use rusqlite::Result;

impl Database {
    pub fn get_project_export_meta(&self, project_id: &str) -> Result<ProjectExportMeta> {
        let conn = self.conn.lock().unwrap();
        export_meta_repository::get_project_export_meta(&conn, project_id)
    }

    pub fn import_project_data(&self, data: &ProjectExport) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let tx = conn.unchecked_transaction()?;
        let project_id = import_repository::import_project_data(&tx, data)?;
        tx.commit()?;
        Ok(project_id)
    }
}
