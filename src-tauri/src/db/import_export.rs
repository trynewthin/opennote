use chrono::Utc;
use rusqlite::{params, Result};
use std::collections::HashMap;
use uuid::Uuid;

use crate::db::Database;
use crate::models::*;

impl Database {
    /// 导出项目的完整数据
    pub fn export_project_data(&self, project_id: &str) -> Result<ProjectExport> {
        let conn = self.conn.lock().unwrap();

        // 读取项目信息
        let project_meta = conn.query_row(
            "SELECT name, description, config FROM projects WHERE id = ?1",
            params![project_id],
            |row| {
                Ok(ProjectExportMeta {
                    name: row.get(0)?,
                    description: row.get(1)?,
                    config: row.get(2)?,
                })
            },
        )?;

        // 释放锁后使用已有方法获取图谱数据
        drop(conn);
        let graph = self.get_graph_data(project_id)?;

        Ok(ProjectExport {
            version: "1.0".to_string(),
            exported_at: Utc::now().to_rfc3339(),
            project: project_meta,
            graph,
        })
    }

    /// 导入项目数据（在一个事务中完成）
    pub fn import_project_data(&self, data: &ProjectExport) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let tx = conn.unchecked_transaction()?;

        let now = Utc::now().timestamp_millis();
        let project_id = Uuid::new_v4().to_string();

        // 1. 创建项目
        tx.execute(
            "INSERT INTO projects (id, name, description, config, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![project_id, data.project.name, data.project.description, data.project.config, now, now],
        )?;

        // 2. ID 映射表
        let mut node_id_map: HashMap<String, String> = HashMap::new();
        let mut content_id_map: HashMap<String, String> = HashMap::new();
        let mut group_id_map: HashMap<String, String> = HashMap::new();

        // 3. 创建节点（保留全部字段含 config）
        for node in &data.graph.nodes {
            let new_id = Uuid::new_v4().to_string();
            tx.execute(
                "INSERT INTO nodes (id, project_id, title, x, y, config, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![new_id, project_id, node.title, node.x, node.y, node.config, now, now],
            )?;
            node_id_map.insert(node.id.clone(), new_id);
        }

        // 4. 创建内容（保留全部字段含 config）
        for content in &data.graph.contents {
            let new_id = Uuid::new_v4().to_string();
            tx.execute(
                "INSERT INTO contents (id, project_id, content_type, value_text, value_number, config, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![new_id, project_id, content.content_type, content.value_text, content.value_number, content.config, now],
            )?;
            content_id_map.insert(content.id.clone(), new_id);
        }

        // 5. 创建节点-内容关联
        for rel in &data.graph.node_content_rels {
            if let (Some(new_node), Some(new_content)) = (
                node_id_map.get(&rel.node_id),
                content_id_map.get(&rel.content_id),
            ) {
                tx.execute(
                    "INSERT INTO node_content_rels (node_id, content_id, sort_order, rel_x, rel_y) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![new_node, new_content, rel.sort_order, rel.rel_x, rel.rel_y],
                )?;
            }
        }

        // 6. 创建连线（保留全部字段含 config）
        for link in &data.graph.links {
            if let (Some(new_src), Some(new_tgt)) = (
                node_id_map.get(&link.source_id),
                node_id_map.get(&link.target_id),
            ) {
                let new_id = Uuid::new_v4().to_string();
                tx.execute(
                    "INSERT INTO links (id, project_id, source_id, target_id, label, direction, link_type, weight, sort_order, config, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                    params![new_id, project_id, new_src, new_tgt, link.label, link.direction, link.link_type, link.weight, link.sort_order, link.config, now],
                )?;
            }
        }

        // 7. 创建分组
        for group in &data.graph.groups {
            let new_id = Uuid::new_v4().to_string();
            tx.execute(
                "INSERT INTO groups (id, project_id, name, color, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![new_id, project_id, group.name, group.color, now],
            )?;
            group_id_map.insert(group.id.clone(), new_id);
        }

        // 8. 创建分组成员
        for member in &data.graph.group_members {
            if let (Some(new_group), Some(new_node)) = (
                group_id_map.get(&member.group_id),
                node_id_map.get(&member.node_id),
            ) {
                tx.execute(
                    "INSERT OR IGNORE INTO group_members (group_id, node_id) VALUES (?1, ?2)",
                    params![new_group, new_node],
                )?;
            }
        }

        tx.commit()?;
        Ok(project_id)
    }
}
