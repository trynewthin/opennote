use rusqlite::{Result, params};
use crate::models::Node;
use crate::db::Database;
use uuid::Uuid;
use chrono::Utc;

impl Database {
    pub fn create_node(&self, project_id: &str, title: &str, x: f64, y: f64) -> Result<Node> {
        let conn = self.conn.lock().unwrap();
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "INSERT INTO nodes (id, project_id, title, x, y, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, project_id, title, x, y, now, now],
        )?;

        Ok(Node {
            id,
            project_id: project_id.to_string(),
            title: title.to_string(),
            x, y,
            config: None,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update_node(&self, id: &str, title: &str) -> Result<Node> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE nodes SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, id],
        )?;

        conn.query_row(
            "SELECT id, project_id, title, x, y, config, created_at, updated_at FROM nodes WHERE id = ?1",
            params![id],
            Self::map_node,
        )
    }

    pub fn update_node_position(&self, id: &str, x: f64, y: f64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE nodes SET x = ?1, y = ?2 WHERE id = ?3", params![x, y, id])?;
        Ok(())
    }

    pub fn update_node_config(&self, id: &str, config: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE nodes SET config = ?1 WHERE id = ?2", params![config, id])?;
        Ok(())
    }

    pub fn delete_node(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM nodes WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn batch_delete_nodes(&self, ids: &[String]) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        for id in ids {
            conn.execute("DELETE FROM nodes WHERE id = ?1", params![id])?;
        }
        Ok(())
    }

    pub fn get_all_nodes_in_project(&self, project_id: &str) -> Result<Vec<Node>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, project_id, title, x, y, config, created_at, updated_at
             FROM nodes WHERE project_id = ?1 ORDER BY created_at DESC",
        )?;

        let rows = stmt.query_map(params![project_id], Self::map_node)?
            .collect::<Result<Vec<_>>>();
        rows
    }

    pub fn search_nodes(&self, project_id: &str, query: &str) -> Result<Vec<Node>> {
        let conn = self.conn.lock().unwrap();
        let pattern = format!("%{}%", query);

        let mut stmt = conn.prepare(
            "SELECT DISTINCT n.id, n.project_id, n.title, n.x, n.y, n.config, n.created_at, n.updated_at
             FROM nodes n
             LEFT JOIN node_content_rels ncr ON ncr.node_id = n.id
             LEFT JOIN contents c ON c.id = ncr.content_id AND c.content_type = 'text'
             WHERE n.project_id = ?1 AND (n.title LIKE ?2 OR c.value_text LIKE ?2)
             ORDER BY n.updated_at DESC",
        )?;

        let rows = stmt.query_map(params![project_id, pattern], Self::map_node)?
            .collect::<Result<Vec<_>>>();
        rows
    }

    fn map_node(row: &rusqlite::Row<'_>) -> rusqlite::Result<Node> {
        Ok(Node {
            id: row.get(0)?,
            project_id: row.get(1)?,
            title: row.get(2)?,
            x: row.get(3)?,
            y: row.get(4)?,
            config: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    }
}
