use crate::db::support::{new_id, now_millis};
use crate::models::Node;
use rusqlite::{params, Connection, Result};

use super::mapper::map_node;

pub fn create(conn: &Connection, project_id: &str, title: &str, x: f64, y: f64) -> Result<Node> {
    let id = new_id();
    let now = now_millis();

    conn.execute(
        "INSERT INTO nodes (id, project_id, title, x, y, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, project_id, title, x, y, now, now],
    )?;

    Ok(Node {
        id,
        project_id: project_id.to_string(),
        title: title.to_string(),
        x,
        y,
        config: None,
        created_at: now,
        updated_at: now,
    })
}

pub fn update(conn: &Connection, id: &str, title: &str) -> Result<Node> {
    conn.execute(
        "UPDATE nodes SET title = ?1, updated_at = ?2 WHERE id = ?3",
        params![title, now_millis(), id],
    )?;

    conn.query_row(
        "SELECT id, project_id, title, x, y, config, created_at, updated_at FROM nodes WHERE id = ?1",
        params![id],
        map_node,
    )
}

pub fn update_position(conn: &Connection, id: &str, x: f64, y: f64) -> Result<()> {
    conn.execute(
        "UPDATE nodes SET x = ?1, y = ?2 WHERE id = ?3",
        params![x, y, id],
    )?;
    Ok(())
}

pub fn update_config(conn: &Connection, id: &str, config: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE nodes SET config = ?1 WHERE id = ?2",
        params![config, id],
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
