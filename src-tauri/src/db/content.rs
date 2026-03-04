use rusqlite::{Result, params};
use crate::models::{Content, NodeContentRel};
use crate::db::Database;
use uuid::Uuid;
use chrono::Utc;

impl Database {
    /// 创建一个内容块
    pub fn create_content(
        &self,
        project_id: &str,
        content_type: &str,
        value_text: Option<&str>,
        value_number: Option<f64>,
    ) -> Result<Content> {
        let conn = self.conn.lock().unwrap();
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "INSERT INTO contents (id, project_id, content_type, value_text, value_number, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, project_id, content_type, value_text, value_number, now],
        )?;

        Ok(Content {
            id,
            project_id: project_id.to_string(),
            content_type: content_type.to_string(),
            value_text: value_text.map(String::from),
            value_number,
            config: None,
            created_at: now,
        })
    }

    /// 更新内容块
    pub fn update_content(
        &self,
        id: &str,
        content_type: &str,
        value_text: Option<&str>,
        value_number: Option<f64>,
    ) -> Result<Content> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "UPDATE contents SET content_type = ?1, value_text = ?2, value_number = ?3 WHERE id = ?4",
            params![content_type, value_text, value_number, id],
        )?;

        conn.query_row(
            "SELECT id, project_id, content_type, value_text, value_number, config, created_at FROM contents WHERE id = ?1",
            params![id],
            |row| Ok(Content {
                id: row.get(0)?,
                project_id: row.get(1)?,
                content_type: row.get(2)?,
                value_text: row.get(3)?,
                value_number: row.get(4)?,
                config: row.get(5)?,
                created_at: row.get(6)?,
            }),
        )
    }

    /// 更新内容配置
    pub fn update_content_config(&self, id: &str, config: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE contents SET config = ?1 WHERE id = ?2", params![config, id])?;
        Ok(())
    }

    /// 删除一个内容块
    pub fn delete_content(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM contents WHERE id = ?1", params![id])?;
        Ok(())
    }

    /// 获取项目中的所有内容块
    pub fn get_contents_by_project(&self, project_id: &str) -> Result<Vec<Content>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, project_id, content_type, value_text, value_number, config, created_at
             FROM contents WHERE project_id = ?1 ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map(params![project_id], |row| Ok(Content {
            id: row.get(0)?,
            project_id: row.get(1)?,
            content_type: row.get(2)?,
            value_text: row.get(3)?,
            value_number: row.get(4)?,
            config: row.get(5)?,
            created_at: row.get(6)?,
        }))?
        .collect::<Result<Vec<_>>>();

        rows
    }

    /// 将内容关联到某个节点
    pub fn add_content_to_node(&self, node_id: &str, content_id: &str, sort_order: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO node_content_rels (node_id, content_id, sort_order, rel_x, rel_y)
             VALUES (?1, ?2, ?3, 0, 0)
             ON CONFLICT(node_id, content_id) DO UPDATE SET sort_order = excluded.sort_order",
            params![node_id, content_id, sort_order],
        )?;
        Ok(())
    }

    /// 解除节点与内容的关联
    pub fn remove_content_from_node(&self, node_id: &str, content_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM node_content_rels WHERE node_id = ?1 AND content_id = ?2",
            params![node_id, content_id],
        )?;
        Ok(())
    }

    /// 获取给定节点列表的所有内容关联关系
    pub fn get_node_content_rels(&self, node_ids: &[String]) -> Result<Vec<NodeContentRel>> {
        if node_ids.is_empty() {
            return Ok(vec![]);
        }

        let conn = self.conn.lock().unwrap();
        let placeholders: Vec<String> = node_ids.iter().enumerate().map(|(i, _)| format!("?{}", i + 1)).collect();
        let sql = format!(
            "SELECT node_id, content_id, sort_order, rel_x, rel_y
             FROM node_content_rels WHERE node_id IN ({}) ORDER BY sort_order ASC",
            placeholders.join(", ")
        );

        let mut stmt = conn.prepare(&sql)?;
        let params: Vec<&dyn rusqlite::types::ToSql> = node_ids.iter().map(|id| id as &dyn rusqlite::types::ToSql).collect();

        let rows = stmt.query_map(params.as_slice(), |row| Ok(NodeContentRel {
            node_id: row.get(0)?,
            content_id: row.get(1)?,
            sort_order: row.get(2)?,
            rel_x: row.get(3)?,
            rel_y: row.get(4)?,
        }))?
        .collect::<Result<Vec<_>>>();

        rows
    }

    /// 更新内容关联的相对位置
    pub fn update_content_rel_position(&self, node_id: &str, content_id: &str, rel_x: f64, rel_y: f64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE node_content_rels SET rel_x = ?3, rel_y = ?4 WHERE node_id = ?1 AND content_id = ?2",
            params![node_id, content_id, rel_x, rel_y],
        )?;
        Ok(())
    }
}
