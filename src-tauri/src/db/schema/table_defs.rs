pub const TABLE_DEFS: &str = "
CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    config      TEXT,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS nodes (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL,
    node_type       TEXT NOT NULL DEFAULT 'concept',
    content         TEXT NOT NULL DEFAULT '',
    semantic_config TEXT,
    view_config     TEXT,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS relations (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL,
    source_id       TEXT NOT NULL,
    target_id       TEXT NOT NULL,
    relation_type   TEXT NOT NULL DEFAULT 'related',
    content         TEXT,
    semantic_config TEXT,
    view_config     TEXT,
    created_at      INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id)  REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id)  REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS groups (
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name       TEXT NOT NULL DEFAULT '',
    color      TEXT NOT NULL DEFAULT '#6366f1',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id   TEXT NOT NULL,
    node_id    TEXT NOT NULL,
    PRIMARY KEY (group_id, node_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
);
";
