use crate::models::ProjectExportMeta;
use rusqlite::{params, Connection, Result};

pub fn get_project_export_meta(conn: &Connection, project_id: &str) -> Result<ProjectExportMeta> {
    conn.query_row(
        "SELECT name, description, config FROM projects WHERE id = ?1",
        params![project_id],
        |row| {
            Ok(ProjectExportMeta {
                name: row.get(0)?,
                description: row.get(1)?,
                config: row.get(2)?,
            })
        },
    )
}
