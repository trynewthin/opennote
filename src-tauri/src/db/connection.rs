use super::schema::{INDEX_DEFS, TABLE_DEFS};
use crate::models::AppSettings;
use rusqlite::{Connection, Result};
use std::sync::Mutex;

pub struct Database {
    pub(crate) conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;
        conn.execute_batch(TABLE_DEFS)?;
        conn.execute_batch(INDEX_DEFS)?;
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;
        conn.execute(
            "INSERT OR IGNORE INTO settings (id, recent_workspaces) VALUES (1, '[]')",
            [],
        )?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn get_settings(&self) -> Result<AppSettings> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT language, theme, recent_workspaces, last_workspace FROM settings WHERE id = 1",
            [],
            |row| {
                let recent_workspaces_raw: String = row.get(2)?;
                Ok(AppSettings {
                    language: row.get(0)?,
                    theme: row.get(1)?,
                    recent_workspaces: serde_json::from_str(&recent_workspaces_raw)
                        .unwrap_or_default(),
                    last_workspace: row.get(3)?,
                })
            },
        )
    }

    pub fn save_settings(&self, settings: &AppSettings) -> Result<AppSettings> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE settings
             SET language = ?1, theme = ?2, recent_workspaces = ?3, last_workspace = ?4
             WHERE id = 1",
            rusqlite::params![
                settings.language,
                settings.theme,
                serde_json::to_string(&settings.recent_workspaces).unwrap_or_else(|_| "[]".into()),
                settings.last_workspace,
            ],
        )?;
        drop(conn);
        self.get_settings()
    }

    pub fn set_last_workspace(&self, path: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE settings SET last_workspace = ?1 WHERE id = 1",
            rusqlite::params![path],
        )?;
        Ok(())
    }

    pub fn push_recent_workspace(&self, workspace_path: &str) -> Result<AppSettings> {
        let mut settings = self.get_settings()?;
        settings
            .recent_workspaces
            .retain(|item| item != workspace_path);
        settings.recent_workspaces.insert(0, workspace_path.into());
        settings.recent_workspaces.truncate(10);
        self.save_settings(&settings)
    }
}
