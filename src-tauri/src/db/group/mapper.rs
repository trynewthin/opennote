use crate::models::{Group, GroupMember};
use rusqlite::Row;

pub fn map_group(row: &Row<'_>) -> rusqlite::Result<Group> {
    Ok(Group {
        id: row.get(0)?,
        project_id: row.get(1)?,
        name: row.get(2)?,
        color: row.get(3)?,
        created_at: row.get(4)?,
    })
}

pub fn map_group_member(row: &Row<'_>) -> rusqlite::Result<GroupMember> {
    Ok(GroupMember {
        group_id: row.get(0)?,
        node_id: row.get(1)?,
    })
}
