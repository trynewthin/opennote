use crate::models::{Content, NodeContentRel};
use rusqlite::Row;

pub fn map_content(row: &Row<'_>) -> rusqlite::Result<Content> {
    Ok(Content {
        id: row.get(0)?,
        project_id: row.get(1)?,
        content_type: row.get(2)?,
        value_text: row.get(3)?,
        value_number: row.get(4)?,
        config: row.get(5)?,
        created_at: row.get(6)?,
    })
}

pub fn map_node_content_rel(row: &Row<'_>) -> rusqlite::Result<NodeContentRel> {
    Ok(NodeContentRel {
        node_id: row.get(0)?,
        content_id: row.get(1)?,
        sort_order: row.get(2)?,
        rel_x: row.get(3)?,
        rel_y: row.get(4)?,
    })
}
