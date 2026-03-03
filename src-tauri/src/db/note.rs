use rusqlite::{Result, params};
use crate::models::Note;
use crate::db::Database;
use uuid::Uuid;
use chrono::Utc;

impl Database {
    pub fn create_note(&self, project_id: &str, parent_id: Option<&str>, title: &str, x: f64, y: f64) -> Result<Note> {
        let conn = self.conn.lock().unwrap();
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        // 计算 depth
        let depth: i64 = match parent_id {
            Some(pid) => {
                conn.query_row(
                    "SELECT depth FROM notes WHERE id = ?1", params![pid], |row| row.get::<_, i64>(0),
                ).unwrap_or(0) + 1
            }
            None => 0,
        };

        conn.execute(
            "INSERT INTO notes (id, project_id, parent_id, title, x, y, depth, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![id, project_id, parent_id, title, x, y, depth, now, now],
        )?;

        Ok(Note {
            id,
            project_id: project_id.to_string(),
            parent_id: parent_id.map(String::from),
            title: title.to_string(),
            x, y,
            depth,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update_note(&self, id: &str, title: &str) -> Result<Note> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE notes SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, id],
        )?;

        conn.query_row(
            "SELECT id, project_id, parent_id, title, x, y, depth, created_at, updated_at FROM notes WHERE id = ?1",
            params![id],
            |row| Ok(Note {
                id: row.get(0)?,
                project_id: row.get(1)?,
                parent_id: row.get(2)?,
                title: row.get(3)?,
                x: row.get(4)?,
                y: row.get(5)?,
                depth: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            }),
        )
    }

    pub fn update_note_position(&self, id: &str, x: f64, y: f64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE notes SET x = ?1, y = ?2 WHERE id = ?3", params![x, y, id])?;
        Ok(())
    }

    pub fn delete_note(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
        Ok(())
    }

    /// 移动节点到新的父级（重新计算 depth）
    pub fn move_note(&self, id: &str, new_parent_id: Option<&str>) -> Result<Note> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().timestamp_millis();

        let new_depth: i64 = match new_parent_id {
            Some(pid) => {
                conn.query_row(
                    "SELECT depth FROM notes WHERE id = ?1", params![pid], |row| row.get::<_, i64>(0),
                ).unwrap_or(0) + 1
            }
            None => 0,
        };

        // 计算 depth 差值用于递归更新子节点
        let old_depth: i64 = conn.query_row(
            "SELECT depth FROM notes WHERE id = ?1", params![id], |row| row.get(0),
        )?;
        let depth_delta = new_depth - old_depth;

        // 更新自身
        conn.execute(
            "UPDATE notes SET parent_id = ?1, depth = ?2, updated_at = ?3 WHERE id = ?4",
            params![new_parent_id, new_depth, now, id],
        )?;

        // 递归更新所有子孙节点的 depth
        if depth_delta != 0 {
            Self::update_descendants_depth(&conn, id, depth_delta)?;
        }

        conn.query_row(
            "SELECT id, project_id, parent_id, title, x, y, depth, created_at, updated_at FROM notes WHERE id = ?1",
            params![id],
            Self::map_note,
        )
    }

    /// 递归更新子孙 depth（内部辅助）
    fn update_descendants_depth(conn: &rusqlite::Connection, parent_id: &str, delta: i64) -> Result<()> {
        conn.execute(
            "UPDATE notes SET depth = depth + ?1 WHERE parent_id = ?2",
            params![delta, parent_id],
        )?;
        // 获取直接子节点 id，递归
        let mut stmt = conn.prepare("SELECT id FROM notes WHERE parent_id = ?1")?;
        let child_ids: Vec<String> = stmt.query_map(params![parent_id], |row| row.get(0))?
            .collect::<Result<Vec<_>>>()?;
        for cid in child_ids {
            Self::update_descendants_depth(conn, &cid, delta)?;
        }
        Ok(())
    }

    /// 批量删除节点（CASCADE 会自动清理子节点、属性、关联）
    pub fn batch_delete_notes(&self, ids: &[String]) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        for id in ids {
            conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
        }
        Ok(())
    }

    /// 批量移动节点到新的父级
    pub fn batch_move_notes(&self, ids: &[String], new_parent_id: Option<&str>) -> Result<()> {
        // 需要逐个移动以正确计算 depth
        drop(self.conn.lock()); // 释放锁，move_note 会自己获取
        for id in ids {
            self.move_note(id, new_parent_id)?;
        }
        Ok(())
    }

    /// 获取多个节点的子节点数量（用于显示"可展开"提示）
    pub fn get_children_counts(&self, node_ids: &[String]) -> Result<Vec<(String, i64)>> {
        if node_ids.is_empty() {
            return Ok(vec![]);
        }
        let conn = self.conn.lock().unwrap();
        let placeholders: Vec<String> = node_ids.iter().enumerate().map(|(i, _)| format!("?{}", i + 1)).collect();
        let sql = format!(
            "SELECT parent_id, COUNT(*) FROM notes WHERE parent_id IN ({}) GROUP BY parent_id",
            placeholders.join(", ")
        );
        let mut stmt = conn.prepare(&sql)?;
        let params: Vec<&dyn rusqlite::types::ToSql> = node_ids.iter().map(|id| id as &dyn rusqlite::types::ToSql).collect();
        let rows = stmt.query_map(params.as_slice(), |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })?.collect::<Result<Vec<_>>>()?;
        Ok(rows)
    }

    /// 获取某层级下的节点（parent_id 为 null 时获取顶级节点）
    pub fn get_notes_by_parent(&self, project_id: &str, parent_id: Option<&str>) -> Result<Vec<Note>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = match parent_id {
            Some(_) => conn.prepare(
                "SELECT id, project_id, parent_id, title, x, y, depth, created_at, updated_at
                 FROM notes WHERE project_id = ?1 AND parent_id = ?2 ORDER BY created_at DESC",
            )?,
            None => conn.prepare(
                "SELECT id, project_id, parent_id, title, x, y, depth, created_at, updated_at
                 FROM notes WHERE project_id = ?1 AND parent_id IS NULL ORDER BY created_at DESC",
            )?,
        };

        let rows = match parent_id {
            Some(pid) => stmt.query_map(params![project_id, pid], Self::map_note)?,
            None => stmt.query_map(params![project_id], Self::map_note)?,
        };

        rows.collect::<Result<Vec<_>>>()
    }

    /// 获取一个项目的所有节点（用于搜索等需要全量数据的场景）
    pub fn get_all_notes_in_project(&self, project_id: &str) -> Result<Vec<Note>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, project_id, parent_id, title, x, y, depth, created_at, updated_at
             FROM notes WHERE project_id = ?1 ORDER BY depth ASC, created_at DESC",
        )?;

        let rows = stmt.query_map(params![project_id], Self::map_note)?
            .collect::<Result<Vec<_>>>();
        rows
    }

    pub fn search_notes(&self, project_id: &str, query: &str) -> Result<Vec<Note>> {
        let conn = self.conn.lock().unwrap();
        let pattern = format!("%{}%", query);

        // 搜索标题 + 属性文本值
        let mut stmt = conn.prepare(
            "SELECT DISTINCT n.id, n.project_id, n.parent_id, n.title, n.x, n.y, n.depth, n.created_at, n.updated_at
             FROM notes n
             LEFT JOIN properties p ON p.node_id = n.id AND p.prop_type = 'text'
             WHERE n.project_id = ?1 AND (n.title LIKE ?2 OR p.value_text LIKE ?2)
             ORDER BY n.updated_at DESC",
        )?;

        let rows = stmt.query_map(params![project_id, pattern], Self::map_note)?
            .collect::<Result<Vec<_>>>();
        rows
    }

    /// 获取节点的祖先链（面包屑用）
    pub fn get_ancestors(&self, node_id: &str) -> Result<Vec<Note>> {
        let conn = self.conn.lock().unwrap();
        let mut ancestors = Vec::new();
        let mut current_id = Some(node_id.to_string());

        while let Some(ref id) = current_id {
            let note = conn.query_row(
                "SELECT id, project_id, parent_id, title, x, y, depth, created_at, updated_at FROM notes WHERE id = ?1",
                params![id],
                Self::map_note,
            );

            match note {
                Ok(n) => {
                    current_id = n.parent_id.clone();
                    ancestors.push(n);
                }
                Err(_) => break,
            }
        }

        ancestors.reverse();
        Ok(ancestors)
    }

    fn map_note(row: &rusqlite::Row<'_>) -> rusqlite::Result<Note> {
        Ok(Note {
            id: row.get(0)?,
            project_id: row.get(1)?,
            parent_id: row.get(2)?,
            title: row.get(3)?,
            x: row.get(4)?,
            y: row.get(5)?,
            depth: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    }
}
