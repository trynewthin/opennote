use super::mapper::map_node_content_rel;
use crate::models::NodeContentRel;
use rusqlite::{params, types::ToSql, Connection, Result};

pub fn attach_to_node(
    conn: &Connection,
    node_id: &str,
    content_id: &str,
    sort_order: i64,
) -> Result<()> {
    conn.execute(
        "INSERT INTO node_content_rels (node_id, content_id, sort_order, rel_x, rel_y)
         VALUES (?1, ?2, ?3, 0, 0)
         ON CONFLICT(node_id, content_id) DO UPDATE SET sort_order = excluded.sort_order",
        params![node_id, content_id, sort_order],
    )?;
    Ok(())
}

pub fn detach_from_node(conn: &Connection, node_id: &str, content_id: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM node_content_rels WHERE node_id = ?1 AND content_id = ?2",
        params![node_id, content_id],
    )?;
    Ok(())
}

pub fn list_for_nodes(conn: &Connection, node_ids: &[String]) -> Result<Vec<NodeContentRel>> {
    if node_ids.is_empty() {
        return Ok(vec![]);
    }

    let placeholders: Vec<String> = node_ids
        .iter()
        .enumerate()
        .map(|(index, _)| format!("?{}", index + 1))
        .collect();
    let sql = format!(
        "SELECT node_id, content_id, sort_order, rel_x, rel_y
         FROM node_content_rels WHERE node_id IN ({}) ORDER BY sort_order ASC",
        placeholders.join(", ")
    );

    let params: Vec<&dyn ToSql> = node_ids.iter().map(|id| id as &dyn ToSql).collect();
    let mut stmt = conn.prepare(&sql)?;

    let rows = stmt
        .query_map(params.as_slice(), map_node_content_rel)?
        .collect::<Result<Vec<_>>>()?;

    Ok(rows)
}

pub fn update_position(
    conn: &Connection,
    node_id: &str,
    content_id: &str,
    rel_x: f64,
    rel_y: f64,
) -> Result<()> {
    conn.execute(
        "UPDATE node_content_rels SET rel_x = ?3, rel_y = ?4 WHERE node_id = ?1 AND content_id = ?2",
        params![node_id, content_id, rel_x, rel_y],
    )?;
    Ok(())
}
