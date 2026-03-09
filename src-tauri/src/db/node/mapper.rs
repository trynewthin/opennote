use crate::models::Node;
use rusqlite::Row;

pub fn map_node(row: &Row<'_>) -> rusqlite::Result<Node> {
    Ok(Node {
        id: row.get(0)?,
        project_id: row.get(1)?,
        title: row.get(2)?,
        x: row.get(3)?,
        y: row.get(4)?,
        config: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}
