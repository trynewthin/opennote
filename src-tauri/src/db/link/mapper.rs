use crate::models::Link;
use rusqlite::Row;

pub fn map_link(row: &Row<'_>) -> rusqlite::Result<Link> {
    Ok(Link {
        id: row.get(0)?,
        project_id: row.get(1)?,
        source_id: row.get(2)?,
        target_id: row.get(3)?,
        label: row.get(4)?,
        direction: row.get(5)?,
        link_type: row.get(6)?,
        weight: row.get(7)?,
        sort_order: row.get(8)?,
        config: row.get(9)?,
        created_at: row.get(10)?,
    })
}
