use crate::db::support::new_id;
use crate::models::ProjectExport;
use rusqlite::{params, Result, Transaction};
use std::collections::HashMap;

pub fn import_relations(
    tx: &Transaction<'_>,
    project_id: &str,
    data: &ProjectExport,
    node_id_map: &HashMap<String, String>,
    now: i64,
) -> Result<()> {
    for relation in &data.graph.relations {
        if let (Some(new_src), Some(new_tgt)) = (
            node_id_map.get(&relation.source_id),
            node_id_map.get(&relation.target_id),
        ) {
            tx.execute(
                "INSERT INTO relations (id, project_id, source_id, target_id, relation_type, content, semantic_config, view_config, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    new_id(),
                    project_id,
                    new_src,
                    new_tgt,
                    relation.relation_type,
                    relation.content,
                    relation.semantic_config,
                    relation.view_config,
                    now
                ],
            )?;
        }
    }
    Ok(())
}

pub fn import_group_members(
    tx: &Transaction<'_>,
    data: &ProjectExport,
    group_id_map: &HashMap<String, String>,
    node_id_map: &HashMap<String, String>,
) -> Result<()> {
    for member in &data.graph.group_members {
        if let (Some(new_group), Some(new_node)) = (
            group_id_map.get(&member.group_id),
            node_id_map.get(&member.node_id),
        ) {
            tx.execute(
                "INSERT OR IGNORE INTO group_members (group_id, node_id) VALUES (?1, ?2)",
                params![new_group, new_node],
            )?;
        }
    }
    Ok(())
}
