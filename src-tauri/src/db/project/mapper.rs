use crate::models::Project;
use rusqlite::Row;

pub fn map_project(row: &Row<'_>) -> rusqlite::Result<Project> {
    Ok(Project {
        id: row.get(0)?,
        name: row.get(1)?,
        description: row.get(2)?,
        config: row.get(3)?,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
    })
}
