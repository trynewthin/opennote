use rusqlite::{Result, params};
use crate::models::Property;
use crate::db::Database;
use uuid::Uuid;
use chrono::Utc;

impl Database {
    /// 设置属性（upsert：同 node_id + prop_key 存在则更新，否则创建）
    pub fn set_property(
        &self,
        node_id: &str,
        prop_type: &str,
        prop_key: &str,
        value_text: Option<&str>,
        value_number: Option<f64>,
        sort_order: i64,
    ) -> Result<Property> {
        let conn = self.conn.lock().unwrap();

        // 检查是否已存在
        let existing: Option<String> = conn.query_row(
            "SELECT id FROM properties WHERE node_id = ?1 AND prop_key = ?2",
            params![node_id, prop_key],
            |row| row.get(0),
        ).ok();

        let now = Utc::now().timestamp_millis();

        if let Some(id) = existing {
            // 更新
            conn.execute(
                "UPDATE properties SET prop_type = ?1, value_text = ?2, value_number = ?3, sort_order = ?4 WHERE id = ?5",
                params![prop_type, value_text, value_number, sort_order, id],
            )?;

            Ok(Property {
                id,
                node_id: node_id.to_string(),
                prop_type: prop_type.to_string(),
                prop_key: prop_key.to_string(),
                value_text: value_text.map(String::from),
                value_number,
                sort_order,
                created_at: now,
            })
        } else {
            // 创建
            let id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO properties (id, node_id, prop_type, prop_key, value_text, value_number, sort_order, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![id, node_id, prop_type, prop_key, value_text, value_number, sort_order, now],
            )?;

            Ok(Property {
                id,
                node_id: node_id.to_string(),
                prop_type: prop_type.to_string(),
                prop_key: prop_key.to_string(),
                value_text: value_text.map(String::from),
                value_number,
                sort_order,
                created_at: now,
            })
        }
    }

    /// 获取一个节点的所有属性
    pub fn get_properties(&self, node_id: &str) -> Result<Vec<Property>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, node_id, prop_type, prop_key, value_text, value_number, sort_order, created_at
             FROM properties WHERE node_id = ?1 ORDER BY sort_order ASC, created_at ASC",
        )?;

        let rows = stmt.query_map(params![node_id], |row| Ok(Property {
            id: row.get(0)?,
            node_id: row.get(1)?,
            prop_type: row.get(2)?,
            prop_key: row.get(3)?,
            value_text: row.get(4)?,
            value_number: row.get(5)?,
            sort_order: row.get(6)?,
            created_at: row.get(7)?,
        }))?
        .collect::<Result<Vec<_>>>();
        rows
    }

    /// 批量获取项目下所有节点的属性（图谱加载用）
    pub fn get_properties_by_nodes(&self, node_ids: &[String]) -> Result<Vec<Property>> {
        if node_ids.is_empty() {
            return Ok(vec![]);
        }

        let conn = self.conn.lock().unwrap();
        let placeholders: Vec<String> = node_ids.iter().enumerate().map(|(i, _)| format!("?{}", i + 1)).collect();
        let sql = format!(
            "SELECT id, node_id, prop_type, prop_key, value_text, value_number, sort_order, created_at
             FROM properties WHERE node_id IN ({}) ORDER BY sort_order ASC",
            placeholders.join(", ")
        );

        let mut stmt = conn.prepare(&sql)?;
        let params: Vec<&dyn rusqlite::types::ToSql> = node_ids.iter().map(|id| id as &dyn rusqlite::types::ToSql).collect();

        let rows = stmt.query_map(params.as_slice(), |row| Ok(Property {
            id: row.get(0)?,
            node_id: row.get(1)?,
            prop_type: row.get(2)?,
            prop_key: row.get(3)?,
            value_text: row.get(4)?,
            value_number: row.get(5)?,
            sort_order: row.get(6)?,
            created_at: row.get(7)?,
        }))?
        .collect::<Result<Vec<_>>>();
        rows
    }

    pub fn delete_property(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM properties WHERE id = ?1", params![id])?;
        Ok(())
    }
}
