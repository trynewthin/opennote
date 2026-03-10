use crate::models::Node;
use rusqlite::{params, Connection, OptionalExtension, Result};

use super::mapper::map_node;

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<Node>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, node_type, content, semantic_config, view_config, created_at, updated_at
         FROM nodes WHERE project_id = ?1 ORDER BY created_at DESC",
    )?;

    let rows = stmt
        .query_map(params![project_id], map_node)?
        .collect::<Result<Vec<_>>>()?;
    Ok(rows)
}

pub fn get_by_id(conn: &Connection, id: &str) -> Result<Option<Node>> {
    conn.query_row(
        "SELECT id, project_id, node_type, content, semantic_config, view_config, created_at, updated_at
         FROM nodes WHERE id = ?1",
        params![id],
        map_node,
    )
    .optional()
}

pub fn search(conn: &Connection, project_id: &str, query: &str) -> Result<Vec<Node>> {
    let pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT n.id, n.project_id, n.node_type, n.content, n.semantic_config, n.view_config, n.created_at, n.updated_at
         FROM nodes n
         WHERE n.project_id = ?1 AND n.content LIKE ?2
         ORDER BY n.updated_at DESC",
    )?;

    let rows = stmt
        .query_map(params![project_id, pattern], map_node)?
        .collect::<Result<Vec<_>>>()?;
    Ok(rows)
}
