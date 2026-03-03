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
                created_at  INTEGER NOT NULL,
                updated_at  INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS notes (
                id         TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                parent_id  TEXT,
                title      TEXT NOT NULL DEFAULT '',
                x          REAL NOT NULL DEFAULT 0.0,
                y          REAL NOT NULL DEFAULT 0.0,
                depth      INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id)  REFERENCES notes(id)    ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS properties (
                id           TEXT PRIMARY KEY,
                node_id      TEXT NOT NULL,
                prop_type    TEXT NOT NULL DEFAULT 'text',
                prop_key     TEXT NOT NULL DEFAULT 'content',
                value_text   TEXT,
                value_number REAL,
                sort_order   INTEGER NOT NULL DEFAULT 0,
                created_at   INTEGER NOT NULL,
                FOREIGN KEY (node_id) REFERENCES notes(id) ON DELETE CASCADE
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
                created_at INTEGER NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (source_id) REFERENCES notes(id) ON DELETE CASCADE,
                FOREIGN KEY (target_id) REFERENCES notes(id) ON DELETE CASCADE
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
                note_id    TEXT NOT NULL,
                PRIMARY KEY (group_id, note_id),
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_notes_project  ON notes(project_id);
            CREATE INDEX IF NOT EXISTS idx_notes_parent   ON notes(parent_id);
            CREATE INDEX IF NOT EXISTS idx_props_node     ON properties(node_id);
            CREATE INDEX IF NOT EXISTS idx_links_project  ON links(project_id);
            CREATE INDEX IF NOT EXISTS idx_links_source   ON links(source_id);
            CREATE INDEX IF NOT EXISTS idx_links_target   ON links(target_id);
            CREATE INDEX IF NOT EXISTS idx_groups_project  ON groups(project_id);
            CREATE INDEX IF NOT EXISTS idx_gm_group       ON group_members(group_id);
            CREATE INDEX IF NOT EXISTS idx_gm_note        ON group_members(note_id);",
        )?;

        conn.execute_batch("PRAGMA foreign_keys = ON;")?;

        Ok(Self { conn: Mutex::new(conn) })
    }
}
