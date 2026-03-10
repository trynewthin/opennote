use crate::models::Relation;
use rusqlite::Row;

pub fn map_relation(row: &Row<'_>) -> rusqlite::Result<Relation> {
    Ok(Relation {
        id: row.get(0)?,
        project_id: row.get(1)?,
        source_id: row.get(2)?,
        target_id: row.get(3)?,
        relation_type: row.get(4)?,
        content: row.get(5)?,
        semantic_config: row.get(6)?,
        view_config: row.get(7)?,
        created_at: row.get(8)?,
    })
}
