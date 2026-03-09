use super::mapper::map_content;
use crate::db::support::{new_id, now_millis};
use crate::models::Content;
use rusqlite::{params, Connection, Result};

pub fn create(
    conn: &Connection,
    project_id: &str,
    content_type: &str,
    value_text: Option<&str>,
    value_number: Option<f64>,
) -> Result<Content> {
    let id = new_id();
    let now = now_millis();

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

pub fn update(
    conn: &Connection,
    id: &str,
    content_type: &str,
    value_text: Option<&str>,
    value_number: Option<f64>,
) -> Result<Content> {
    conn.execute(
        "UPDATE contents SET content_type = ?1, value_text = ?2, value_number = ?3 WHERE id = ?4",
        params![content_type, value_text, value_number, id],
    )?;

    conn.query_row(
        "SELECT id, project_id, content_type, value_text, value_number, config, created_at
         FROM contents WHERE id = ?1",
        params![id],
        map_content,
    )
}

pub fn update_config(conn: &Connection, id: &str, config: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE contents SET config = ?1 WHERE id = ?2",
        params![config, id],
    )?;
    Ok(())
}

pub fn delete(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM contents WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<Content>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, content_type, value_text, value_number, config, created_at
         FROM contents WHERE project_id = ?1 ORDER BY created_at ASC",
    )?;

    let rows = stmt
        .query_map(params![project_id], map_content)?
        .collect::<Result<Vec<_>>>()?;

    Ok(rows)
}
