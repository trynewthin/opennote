use crate::db::Database;
use crate::models::Link;
use chrono::Utc;
use rusqlite::{params, Result};
use uuid::Uuid;

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
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "INSERT INTO links (id, project_id, source_id, target_id, label, direction, link_type, weight, sort_order, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![id, project_id, source_id, target_id, label, direction, link_type, weight, sort_order, now],
        )?;

        Ok(Link {
            id,
            project_id: project_id.to_string(),
            source_id: source_id.to_string(),
            target_id: target_id.to_string(),
            label: label.map(String::from),
            direction: direction.to_string(),
            link_type: link_type.to_string(),
            weight,
            sort_order,
            config: None,
            created_at: now,
        })
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

        conn.execute(
            "UPDATE links SET label = ?1, direction = ?2, link_type = ?3, weight = ?4, sort_order = ?5 WHERE id = ?6",
            params![label, direction, link_type, weight, sort_order, id],
        )?;

        conn.query_row(
            "SELECT id, project_id, source_id, target_id, label, direction, link_type, weight, sort_order, config, created_at FROM links WHERE id = ?1",
            params![id],
            Self::map_link,
        )
    }

    pub fn update_link_config(&self, id: &str, config: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE links SET config = ?1 WHERE id = ?2",
            params![config, id],
        )?;
        Ok(())
    }

    pub fn delete_link(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM links WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_links_by_project(&self, project_id: &str) -> Result<Vec<Link>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, project_id, source_id, target_id, label, direction, link_type, weight, sort_order, config, created_at
             FROM links WHERE project_id = ?1 ORDER BY sort_order ASC",
        )?;

        let rows = stmt
            .query_map(params![project_id], Self::map_link)?
            .collect::<Result<Vec<_>>>();

        rows
    }

    fn map_link(row: &rusqlite::Row<'_>) -> rusqlite::Result<Link> {
        Ok(Link {
            id: row.get(0)?,
            project_id: row.get(1)?,
            source_id: row.get(2)?,
            target_id: row.get(3)?,
            label: row.get(4)?,
            direction: row.get(5)?,
            link_type: row.get(6)?,
            weight: row.get(7)?,
            sort_order: row.get(8)?,
            config: row.get(9)?,
            created_at: row.get(10)?,
        })
    }
}
