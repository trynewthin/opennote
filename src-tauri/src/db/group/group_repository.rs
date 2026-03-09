use super::mapper::map_group;
use crate::db::support::{new_id, now_millis};
use crate::models::Group;
use rusqlite::{params, Connection, Result};

pub fn create(conn: &Connection, project_id: &str, name: &str, color: &str) -> Result<Group> {
    let id = new_id();
    let now = now_millis();

    conn.execute(
        "INSERT INTO groups (id, project_id, name, color, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, project_id, name, color, now],
    )?;

    Ok(Group {
        id,
        project_id: project_id.to_string(),
        name: name.to_string(),
        color: color.to_string(),
        created_at: now,
    })
}

pub fn update(conn: &Connection, id: &str, name: &str, color: &str) -> Result<Group> {
    conn.execute(
        "UPDATE groups SET name = ?1, color = ?2 WHERE id = ?3",
        params![name, color, id],
    )?;

    conn.query_row(
        "SELECT id, project_id, name, color, created_at FROM groups WHERE id = ?1",
        params![id],
        map_group,
    )
}

pub fn delete(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM groups WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<Group>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, color, created_at FROM groups WHERE project_id = ?1 ORDER BY created_at ASC",
    )?;

    let rows = stmt
        .query_map(params![project_id], map_group)?
        .collect::<Result<Vec<_>>>()?;

    Ok(rows)
}
