use super::mapper::map_link;
use crate::db::support::{new_id, now_millis};
use crate::models::Link;
use rusqlite::{params, Connection, Result};

#[allow(clippy::too_many_arguments)]
pub fn create(
    conn: &Connection,
    project_id: &str,
    source_id: &str,
    target_id: &str,
    label: Option<&str>,
    direction: &str,
    link_type: &str,
    weight: f64,
    sort_order: i64,
) -> Result<Link> {
    let id = new_id();
    let now = now_millis();

    conn.execute(
        "INSERT INTO links (id, project_id, source_id, target_id, label, direction, link_type, weight, sort_order, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![id, project_id, source_id, target_id, label, direction, link_type, weight, sort_order, now],
    )?;

    Ok(Link {
        id,
        project_id: project_id.to_string(),
        source_id: source_id.to_string(),
        target_id: target_id.to_string(),
        label: label.map(String::from),
        direction: direction.to_string(),
        link_type: link_type.to_string(),
        weight,
        sort_order,
        config: None,
        created_at: now,
    })
}

pub fn update(
    conn: &Connection,
    id: &str,
    label: Option<&str>,
    direction: &str,
    link_type: &str,
    weight: f64,
    sort_order: i64,
) -> Result<Link> {
    conn.execute(
        "UPDATE links SET label = ?1, direction = ?2, link_type = ?3, weight = ?4, sort_order = ?5 WHERE id = ?6",
        params![label, direction, link_type, weight, sort_order, id],
    )?;

    conn.query_row(
        "SELECT id, project_id, source_id, target_id, label, direction, link_type, weight, sort_order, config, created_at FROM links WHERE id = ?1",
        params![id],
        map_link,
    )
}

pub fn update_config(conn: &Connection, id: &str, config: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE links SET config = ?1 WHERE id = ?2",
        params![config, id],
    )?;
    Ok(())
}

pub fn delete(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM links WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<Link>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, source_id, target_id, label, direction, link_type, weight, sort_order, config, created_at
         FROM links WHERE project_id = ?1 ORDER BY sort_order ASC",
    )?;

    let rows = stmt
        .query_map(params![project_id], map_link)?
        .collect::<Result<Vec<_>>>()?;
    Ok(rows)
}
