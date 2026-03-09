use super::mapper::map_project;
use crate::db::support::{new_id, now_millis};
use crate::models::Project;
use rusqlite::{params, Connection, Result};

pub fn create(conn: &Connection, name: &str, description: &str) -> Result<Project> {
    let id = new_id();
    let now = now_millis();

    conn.execute(
        "INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, name, description, now, now],
    )?;

    Ok(Project {
        id,
        name: name.to_string(),
        description: description.to_string(),
        config: None,
        created_at: now,
        updated_at: now,
    })
}

pub fn update(conn: &Connection, id: &str, name: &str, description: &str) -> Result<Project> {
    conn.execute(
        "UPDATE projects SET name = ?1, description = ?2, updated_at = ?3 WHERE id = ?4",
        params![name, description, now_millis(), id],
    )?;

    conn.query_row(
        "SELECT id, name, description, config, created_at, updated_at FROM projects WHERE id = ?1",
        params![id],
        map_project,
    )
}

pub fn update_config(conn: &Connection, id: &str, config: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE projects SET config = ?1 WHERE id = ?2",
        params![config, id],
    )?;
    Ok(())
}

pub fn delete(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn list(conn: &Connection) -> Result<Vec<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, config, created_at, updated_at FROM projects ORDER BY updated_at DESC",
    )?;

    let rows = stmt
        .query_map([], map_project)?
        .collect::<Result<Vec<_>>>()?;
    Ok(rows)
}

pub fn get_node_count(conn: &Connection, project_id: &str) -> Result<i64> {
    conn.query_row(
        "SELECT COUNT(*) FROM nodes WHERE project_id = ?1",
        params![project_id],
        |row| row.get(0),
    )
}
