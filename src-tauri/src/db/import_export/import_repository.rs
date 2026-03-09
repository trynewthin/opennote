use crate::db::support::{new_id, now_millis};
use crate::models::ProjectExport;
use rusqlite::{params, Result, Transaction};

use super::graph_entity_import_steps::{import_contents, import_groups, import_nodes};
use super::graph_relationship_import_steps::{
    import_group_members, import_links, import_node_content_rels,
};

pub fn import_project_data(tx: &Transaction<'_>, data: &ProjectExport) -> Result<String> {
    let now = now_millis();
    let project_id = new_id();

    tx.execute(
        "INSERT INTO projects (id, name, description, config, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            project_id,
            data.project.name,
            data.project.description,
            data.project.config,
            now,
            now
        ],
    )?;

    let node_id_map = import_nodes(tx, &project_id, data, now)?;
    let content_id_map = import_contents(tx, &project_id, data, now)?;
    import_node_content_rels(tx, data, &node_id_map, &content_id_map)?;
    import_links(tx, &project_id, data, &node_id_map, now)?;
    let group_id_map = import_groups(tx, &project_id, data, now)?;
    import_group_members(tx, data, &group_id_map, &node_id_map)?;

    Ok(project_id)
}
