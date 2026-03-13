use std::path::PathBuf;

use crate::application::{AppResult, CurrentWorkspace, WorkspaceService};
use crate::db::Database;
use crate::error::AppError;
use crate::models::NodeResourceMetadata;

pub struct NodeService<'a> {
    workspace_service: WorkspaceService<'a>,
}

impl<'a> NodeService<'a> {
    pub fn new(db: &'a Database, current_workspace: &'a CurrentWorkspace) -> Self {
        Self {
            workspace_service: WorkspaceService::new(db, current_workspace),
        }
    }

    pub fn get_resource_metadata(
        &self,
        project_path: &str,
        node_id: &str,
    ) -> AppResult<NodeResourceMetadata> {
        let loaded = self.workspace_service.load_project(project_path)?;
        let node = loaded
            .data
            .nodes
            .into_iter()
            .find(|node| node.id == node_id)
            .ok_or_else(|| AppError::NotFound(format!("Node not found: {node_id}")))?;

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

        if node.node_type != "file" {
            return Ok(NodeResourceMetadata {
                node_id: node.id,
                resolved_path: None,
                display_name: None,
                exists: false,
                mime_type: None,
                size_bytes: None,
            });
        }

        let resolved_path = self
            .workspace_service
            .resolve_reference(&PathBuf::from(&loaded.path), &node.content)?;
        let exists = resolved_path.as_ref().is_some_and(|path| path.exists());
        let display_name = resolved_path
            .as_ref()
            .and_then(|path| path.file_name())
            .and_then(|name| name.to_str())
            .map(String::from)
            .or_else(|| derive_display_name(&node.content));
        let mime_type = resolved_path.as_ref().map(|path| {
            mime_guess::from_path(path)
                .first_or_octet_stream()
                .essence_str()
                .to_string()
        });
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
        .map(String::from)
}

fn strip_query_and_hash(value: &str) -> &str {
    value.split(['?', '#']).next().unwrap_or(value)
}
