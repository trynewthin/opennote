use crate::db::support::new_id;
use crate::models::ProjectExport;
use rusqlite::{params, Result, Transaction};
use std::collections::HashMap;

pub fn import_nodes(
    tx: &Transaction<'_>,
    project_id: &str,
    data: &ProjectExport,
    now: i64,
) -> Result<HashMap<String, String>> {
    let mut id_map = HashMap::new();
    for node in &data.graph.nodes {
        let new_id = new_id();
        tx.execute(
            "INSERT INTO nodes (id, project_id, node_type, content, semantic_config, view_config, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                new_id,
                project_id,
                node.node_type,
                node.content,
                node.semantic_config,
                node.view_config,
                now,
                now
            ],
        )?;
        id_map.insert(node.id.clone(), new_id);
    }
    Ok(id_map)
}

pub fn import_groups(
    tx: &Transaction<'_>,
    project_id: &str,
    data: &ProjectExport,
    now: i64,
) -> Result<HashMap<String, String>> {
    let mut id_map = HashMap::new();
    for group in &data.graph.groups {
        let new_id = new_id();
        tx.execute(
            "INSERT INTO groups (id, project_id, name, color, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![new_id, project_id, group.name, group.color, now],
        )?;
        id_map.insert(group.id.clone(), new_id);
    }
    Ok(id_map)
}
