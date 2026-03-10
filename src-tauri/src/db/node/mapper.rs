use crate::models::Node;
use rusqlite::Row;

pub fn map_node(row: &Row<'_>) -> rusqlite::Result<Node> {
    Ok(Node {
        id: row.get(0)?,
        project_id: row.get(1)?,
        node_type: row.get(2)?,
        content: row.get(3)?,
        semantic_config: row.get(4)?,
        view_config: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}
