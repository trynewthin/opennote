use rusqlite::{Result, params};
use crate::models::{Group, GroupMember};
use crate::db::Database;
use uuid::Uuid;
use chrono::Utc;

impl Database {
    pub fn create_group(&self, project_id: &str, name: &str, color: &str) -> Result<Group> {
        let conn = self.conn.lock().unwrap();
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "INSERT INTO groups (id, project_id, name, color, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, project_id, name, color, now],
        )?;

        Ok(Group {
            id,
            project_id: project_id.to_string(),
            name: name.to_string(),
            color: color.to_string(),
            created_at: now,
        })
    }

    pub fn update_group(&self, id: &str, name: &str, color: &str) -> Result<Group> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "UPDATE groups SET name = ?1, color = ?2 WHERE id = ?3",
            params![name, color, id],
        )?;

        conn.query_row(
            "SELECT id, project_id, name, color, created_at FROM groups WHERE id = ?1",
            params![id],
            |row| Ok(Group {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                color: row.get(3)?,
                created_at: row.get(4)?,
            }),
        )
    }

    pub fn delete_group(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM groups WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_groups_by_project(&self, project_id: &str) -> Result<Vec<Group>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, project_id, name, color, created_at FROM groups WHERE project_id = ?1 ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map(params![project_id], |row| Ok(Group {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            color: row.get(3)?,
            created_at: row.get(4)?,
        }))?
        .collect::<Result<Vec<_>>>();

        rows
    }

    // ─── 分组成员 ───

    pub fn add_node_to_group(&self, group_id: &str, node_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR IGNORE INTO group_members (group_id, node_id) VALUES (?1, ?2)",
            params![group_id, node_id],
        )?;
        Ok(())
    }

    pub fn remove_node_from_group(&self, group_id: &str, node_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM group_members WHERE group_id = ?1 AND node_id = ?2",
            params![group_id, node_id],
        )?;
        Ok(())
    }

    pub fn get_group_members_by_project(&self, project_id: &str) -> Result<Vec<GroupMember>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT gm.group_id, gm.node_id FROM group_members gm
             JOIN groups g ON g.id = gm.group_id
             WHERE g.project_id = ?1",
        )?;

        let rows = stmt.query_map(params![project_id], |row| Ok(GroupMember {
            group_id: row.get(0)?,
            node_id: row.get(1)?,
        }))?
        .collect::<Result<Vec<_>>>();

        rows
    }
}
