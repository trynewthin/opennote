use rusqlite::{Result, params};
use crate::models::Project;
use crate::db::Database;
use uuid::Uuid;
use chrono::Utc;

impl Database {
    pub fn create_project(&self, name: &str, description: &str) -> Result<Project> {
        let conn = self.conn.lock().unwrap();
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, name, description, now, now],
        )?;

        Ok(Project {
            id,
            name: name.to_string(),
            description: description.to_string(),
            config: None,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update_project(&self, id: &str, name: &str, description: &str) -> Result<Project> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE projects SET name = ?1, description = ?2, updated_at = ?3 WHERE id = ?4",
            params![name, description, now, id],
        )?;

        conn.query_row(
            "SELECT id, name, description, config, created_at, updated_at FROM projects WHERE id = ?1",
            params![id],
            |row| Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                config: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            }),
        )
    }

    pub fn update_project_config(&self, id: &str, config: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE projects SET config = ?1 WHERE id = ?2", params![config, id])?;
        Ok(())
    }

    pub fn delete_project(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_all_projects(&self) -> Result<Vec<Project>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, config, created_at, updated_at FROM projects ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map([], |row| Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            config: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        }))?
        .collect::<Result<Vec<_>>>();

        rows
    }

    pub fn get_project_node_count(&self, project_id: &str) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT COUNT(*) FROM nodes WHERE project_id = ?1",
            params![project_id],
            |row| row.get(0),
        )
    }
}
