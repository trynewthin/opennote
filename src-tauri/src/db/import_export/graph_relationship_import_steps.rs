use crate::db::support::new_id;
use crate::models::ProjectExport;
use rusqlite::{params, Result, Transaction};
use std::collections::HashMap;

pub fn import_node_content_rels(
    tx: &Transaction<'_>,
    data: &ProjectExport,
    node_id_map: &HashMap<String, String>,
    content_id_map: &HashMap<String, String>,
) -> Result<()> {
    for rel in &data.graph.node_content_rels {
        if let (Some(new_node), Some(new_content)) = (
            node_id_map.get(&rel.node_id),
            content_id_map.get(&rel.content_id),
        ) {
            tx.execute(
                "INSERT INTO node_content_rels (node_id, content_id, sort_order, rel_x, rel_y) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![new_node, new_content, rel.sort_order, rel.rel_x, rel.rel_y],
            )?;
        }
    }
    Ok(())
}

pub fn import_links(
    tx: &Transaction<'_>,
    project_id: &str,
    data: &ProjectExport,
    node_id_map: &HashMap<String, String>,
    now: i64,
) -> Result<()> {
    for link in &data.graph.links {
        if let (Some(new_src), Some(new_tgt)) = (
            node_id_map.get(&link.source_id),
            node_id_map.get(&link.target_id),
        ) {
            tx.execute(
                "INSERT INTO links (id, project_id, source_id, target_id, label, direction, link_type, weight, sort_order, config, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params![new_id(), project_id, new_src, new_tgt, link.label, link.direction, link.link_type, link.weight, link.sort_order, link.config, now],
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
