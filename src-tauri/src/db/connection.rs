use rusqlite::{Connection, Result};
use std::sync::Mutex;

/// 数据库管理器，线程安全的 SQLite 连接封装
pub struct Database {
    pub(crate) conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS projects (
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

            CREATE INDEX IF NOT EXISTS idx_nodes_project ON nodes(project_id);
            CREATE INDEX IF NOT EXISTS idx_contents_project ON contents(project_id);
            CREATE INDEX IF NOT EXISTS idx_ncr_node ON node_content_rels(node_id);
            CREATE INDEX IF NOT EXISTS idx_ncr_content ON node_content_rels(content_id);
            CREATE INDEX IF NOT EXISTS idx_links_project ON links(project_id);
            CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id);
            CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id);
            CREATE INDEX IF NOT EXISTS idx_groups_project ON groups(project_id);
            CREATE INDEX IF NOT EXISTS idx_gm_group ON group_members(group_id);
            CREATE INDEX IF NOT EXISTS idx_gm_node ON group_members(node_id);",
        )?;

        conn.execute_batch("PRAGMA foreign_keys = ON;")?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}
