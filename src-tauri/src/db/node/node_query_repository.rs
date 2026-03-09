use crate::models::Node;
use rusqlite::{params, Connection, Result};

use super::mapper::map_node;

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<Node>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, title, x, y, config, created_at, updated_at
         FROM nodes WHERE project_id = ?1 ORDER BY created_at DESC",
    )?;

    let rows = stmt
        .query_map(params![project_id], map_node)?
        .collect::<Result<Vec<_>>>()?;
    Ok(rows)
}

pub fn search(conn: &Connection, project_id: &str, query: &str) -> Result<Vec<Node>> {
    let pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT DISTINCT n.id, n.project_id, n.title, n.x, n.y, n.config, n.created_at, n.updated_at
         FROM nodes n
         LEFT JOIN node_content_rels ncr ON ncr.node_id = n.id
         LEFT JOIN contents c ON c.id = ncr.content_id AND c.content_type = 'text'
         WHERE n.project_id = ?1 AND (n.title LIKE ?2 OR c.value_text LIKE ?2)
         ORDER BY n.updated_at DESC",
    )?;

    let rows = stmt
        .query_map(params![project_id, pattern], map_node)?
        .collect::<Result<Vec<_>>>()?;
    Ok(rows)
}
