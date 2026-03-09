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
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title      TEXT NOT NULL DEFAULT '',
    x          REAL NOT NULL DEFAULT 0.0,
    y          REAL NOT NULL DEFAULT 0.0,
    config     TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contents (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text',
    value_text   TEXT,
    value_number REAL,
    config       TEXT,
    created_at   INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS node_content_rels (
    node_id      TEXT NOT NULL,
    content_id   TEXT NOT NULL,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    rel_x        REAL NOT NULL DEFAULT 0,
    rel_y        REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (node_id, content_id),
    FOREIGN KEY (node_id)    REFERENCES nodes(id)    ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS links (
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    source_id  TEXT NOT NULL,
    target_id  TEXT NOT NULL,
    label      TEXT,
    direction  TEXT NOT NULL DEFAULT 'none',
    link_type  TEXT NOT NULL DEFAULT 'related',
    weight     REAL NOT NULL DEFAULT 0.5,
    sort_order INTEGER NOT NULL DEFAULT 0,
    config     TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES nodes(id) ON DELETE CASCADE
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
