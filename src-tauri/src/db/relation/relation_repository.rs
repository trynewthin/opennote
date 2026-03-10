use super::mapper::map_relation;
use crate::db::support::{new_id, now_millis};
use crate::models::Relation;
use rusqlite::{params, Connection, Result};

pub fn create(
    conn: &Connection,
    project_id: &str,
    source_id: &str,
    target_id: &str,
    relation_type: &str,
    content: Option<&str>,
    semantic_config: Option<&str>,
    view_config: Option<&str>,
) -> Result<Relation> {
    let id = new_id();
    let created_at = now_millis();

    conn.execute(
        "INSERT INTO relations (id, project_id, source_id, target_id, relation_type, content, semantic_config, view_config, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            id,
            project_id,
            source_id,
            target_id,
            relation_type,
            content,
            semantic_config,
            view_config,
            created_at
        ],
    )?;

    Ok(Relation {
        id,
        project_id: project_id.to_string(),
        source_id: source_id.to_string(),
        target_id: target_id.to_string(),
        relation_type: relation_type.to_string(),
        content: content.map(String::from),
        semantic_config: semantic_config.map(String::from),
        view_config: view_config.map(String::from),
        created_at,
    })
}

pub fn update(
    conn: &Connection,
    id: &str,
    relation_type: &str,
    content: Option<&str>,
    semantic_config: Option<&str>,
    view_config: Option<&str>,
) -> Result<Relation> {
    conn.execute(
        "UPDATE relations SET relation_type = ?1, content = ?2, semantic_config = ?3, view_config = ?4 WHERE id = ?5",
        params![relation_type, content, semantic_config, view_config, id],
    )?;

    conn.query_row(
        "SELECT id, project_id, source_id, target_id, relation_type, content, semantic_config, view_config, created_at
         FROM relations WHERE id = ?1",
        params![id],
        map_relation,
    )
}

pub fn update_view_config(conn: &Connection, id: &str, config: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE relations SET view_config = ?1 WHERE id = ?2",
        params![config, id],
    )?;
    Ok(())
}

pub fn update_semantic_config(conn: &Connection, id: &str, config: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE relations SET semantic_config = ?1 WHERE id = ?2",
        params![config, id],
    )?;
    Ok(())
}

pub fn delete(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM relations WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<Relation>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, source_id, target_id, relation_type, content, semantic_config, view_config, created_at
         FROM relations WHERE project_id = ?1 ORDER BY created_at ASC",
    )?;

    let rows = stmt
        .query_map(params![project_id], map_relation)?
        .collect::<Result<Vec<_>>>()?;

    Ok(rows)
}
