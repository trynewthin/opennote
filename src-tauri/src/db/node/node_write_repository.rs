use crate::db::support::{new_id, now_millis, with_xy};
use crate::models::Node;
use rusqlite::{params, Connection, Result};

use super::mapper::map_node;

pub fn create(
    conn: &Connection,
    project_id: &str,
    node_type: &str,
    content: &str,
    x: f64,
    y: f64,
) -> Result<Node> {
    let id = new_id();
    let now = now_millis();
    let view_config = with_xy(None, x, y);

    conn.execute(
        "INSERT INTO nodes (id, project_id, node_type, content, semantic_config, view_config, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?6, ?7)",
        params![id, project_id, node_type, content, view_config, now, now],
    )?;

    Ok(Node {
        id,
        project_id: project_id.to_string(),
        node_type: node_type.to_string(),
        content: content.to_string(),
        semantic_config: None,
        view_config,
        created_at: now,
        updated_at: now,
    })
}

pub fn update(conn: &Connection, id: &str, node_type: &str, content: &str) -> Result<Node> {
    conn.execute(
        "UPDATE nodes SET node_type = ?1, content = ?2, updated_at = ?3 WHERE id = ?4",
        params![node_type, content, now_millis(), id],
    )?;

    conn.query_row(
        "SELECT id, project_id, node_type, content, semantic_config, view_config, created_at, updated_at FROM nodes WHERE id = ?1",
        params![id],
        map_node,
    )
}

pub fn update_position(conn: &Connection, id: &str, x: f64, y: f64) -> Result<()> {
    let current_view_config: Option<String> = conn.query_row(
        "SELECT view_config FROM nodes WHERE id = ?1",
        params![id],
        |row| row.get(0),
    )?;
    conn.execute(
        "UPDATE nodes SET view_config = ?1, updated_at = ?2 WHERE id = ?3",
        params![with_xy(current_view_config.as_deref(), x, y), now_millis(), id],
    )?;
    Ok(())
}

pub fn update_view_config(conn: &Connection, id: &str, config: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE nodes SET view_config = ?1, updated_at = ?2 WHERE id = ?3",
        params![config, now_millis(), id],
    )?;
    Ok(())
}

pub fn update_semantic_config(conn: &Connection, id: &str, config: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE nodes SET semantic_config = ?1, updated_at = ?2 WHERE id = ?3",
        params![config, now_millis(), id],
    )?;
    Ok(())
}

pub fn delete(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM nodes WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn batch_delete(conn: &Connection, ids: &[String]) -> Result<()> {
    for id in ids {
        conn.execute("DELETE FROM nodes WHERE id = ?1", params![id])?;
    }
    Ok(())
}
