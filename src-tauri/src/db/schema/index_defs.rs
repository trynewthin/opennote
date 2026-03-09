pub const INDEX_DEFS: &str = "
CREATE INDEX IF NOT EXISTS idx_nodes_project ON nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_contents_project ON contents(project_id);
CREATE INDEX IF NOT EXISTS idx_ncr_node ON node_content_rels(node_id);
CREATE INDEX IF NOT EXISTS idx_ncr_content ON node_content_rels(content_id);
CREATE INDEX IF NOT EXISTS idx_links_project ON links(project_id);
CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id);
CREATE INDEX IF NOT EXISTS idx_groups_project ON groups(project_id);
CREATE INDEX IF NOT EXISTS idx_gm_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_gm_node ON group_members(node_id);
";
