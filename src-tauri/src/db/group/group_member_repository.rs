use super::mapper::map_group_member;
use crate::models::GroupMember;
use rusqlite::{params, Connection, Result};

pub fn attach_node(conn: &Connection, group_id: &str, node_id: &str) -> Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO group_members (group_id, node_id) VALUES (?1, ?2)",
        params![group_id, node_id],
    )?;
    Ok(())
}

pub fn detach_node(conn: &Connection, group_id: &str, node_id: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM group_members WHERE group_id = ?1 AND node_id = ?2",
        params![group_id, node_id],
    )?;
    Ok(())
}

pub fn list_by_project(conn: &Connection, project_id: &str) -> Result<Vec<GroupMember>> {
    let mut stmt = conn.prepare(
        "SELECT gm.group_id, gm.node_id FROM group_members gm
         JOIN groups g ON g.id = gm.group_id
         WHERE g.project_id = ?1",
    )?;

    let rows = stmt
        .query_map(params![project_id], map_group_member)?
        .collect::<Result<Vec<_>>>()?;

    Ok(rows)
}
