use crate::application::AppResult;
use crate::db::Database;
use crate::models::{Node, NodeResourceMetadata};
use rusqlite::Error as SqlError;
use std::path::PathBuf;

pub struct NodeService<'a> {
    db: &'a Database,
}

impl<'a> NodeService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(
        &self,
        project_id: &str,
        node_type: &str,
        content: &str,
        x: f64,
        y: f64,
    ) -> AppResult<Node> {
        self.db
            .create_node(project_id, node_type, content, x, y)
            .map_err(Into::into)
    }

    pub fn update(&self, id: &str, node_type: &str, content: &str) -> AppResult<Node> {
        self.db
            .update_node(id, node_type, content)
            .map_err(Into::into)
    }

    pub fn update_position(&self, id: &str, x: f64, y: f64) -> AppResult<()> {
        self.db.update_node_position(id, x, y).map_err(Into::into)
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        self.db.delete_node(id).map_err(Into::into)
    }

    pub fn search(&self, project_id: &str, query: &str) -> AppResult<Vec<Node>> {
        self.db.search_nodes(project_id, query).map_err(Into::into)
    }

    pub fn batch_delete(&self, ids: &[String]) -> AppResult<()> {
        self.db.batch_delete_nodes(ids).map_err(Into::into)
    }

    pub fn update_view_config(&self, id: &str, config: Option<&str>) -> AppResult<()> {
        self.db
            .update_node_view_config(id, config)
            .map_err(Into::into)
    }

    pub fn update_semantic_config(&self, id: &str, config: Option<&str>) -> AppResult<()> {
        self.db
            .update_node_semantic_config(id, config)
            .map_err(Into::into)
    }

    pub fn get_resource_metadata(&self, id: &str) -> AppResult<NodeResourceMetadata> {
        let node = self
            .db
            .get_node(id)?
            .ok_or(SqlError::QueryReturnedNoRows)?;

        if node.node_type == "url" {
            return Ok(NodeResourceMetadata {
                node_id: node.id,
                resolved_path: None,
                display_name: derive_display_name(&node.content),
                exists: false,
                mime_type: None,
                size_bytes: None,
            });
        }

        if !matches!(node.node_type.as_str(), "file" | "image") {
            return Ok(NodeResourceMetadata {
                node_id: node.id,
                resolved_path: None,
                display_name: None,
                exists: false,
                mime_type: None,
                size_bytes: None,
            });
        }

        let resolved_path = resolve_path(&node.content)?;
        let exists = resolved_path.as_ref().is_some_and(|path| path.exists());
        let display_name = resolved_path
            .as_ref()
            .and_then(|path| path.file_name())
            .and_then(|name| name.to_str())
            .map(|name| name.to_string())
            .or_else(|| derive_display_name(&node.content));
        let mime_type = resolved_path
            .as_ref()
            .map(|path| mime_guess::from_path(path).first_or_octet_stream().essence_str().to_string());
        let size_bytes = resolved_path.as_ref().and_then(|path| {
            std::fs::metadata(path)
                .ok()
                .filter(|metadata| metadata.is_file())
                .map(|metadata| metadata.len())
        });

        Ok(NodeResourceMetadata {
            node_id: node.id,
            resolved_path: resolved_path.map(|path| path.to_string_lossy().to_string()),
            display_name,
            exists,
            mime_type,
            size_bytes,
        })
    }
}

fn resolve_path(raw: &str) -> AppResult<Option<PathBuf>> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }

    let path = PathBuf::from(trimmed);
    if path.is_absolute() {
        return Ok(Some(normalize_path(path)?));
    }

    let base_dir = std::env::current_exe()?
        .parent()
        .map(|path| path.to_path_buf())
        .unwrap_or(std::env::current_dir()?);
    Ok(Some(normalize_path(base_dir.join(path))?))
}

fn normalize_path(path: PathBuf) -> AppResult<PathBuf> {
    match std::fs::canonicalize(&path) {
        Ok(normalized) => Ok(normalized),
        Err(_) => Ok(path),
    }
}

fn derive_display_name(raw: &str) -> Option<String> {
    let trimmed = raw.trim().trim_end_matches(['/', '\\']);
    if trimmed.is_empty() {
        return None;
    }

    trimmed
        .split(['/', '\\'])
        .filter(|piece| !piece.is_empty())
        .next_back()
        .map(strip_query_and_hash)
        .filter(|piece| !piece.is_empty())
        .map(|piece| piece.to_string())
}

fn strip_query_and_hash(value: &str) -> &str {
    value.split(['?', '#']).next().unwrap_or(value)
}
