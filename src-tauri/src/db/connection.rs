use super::schema::{INDEX_DEFS, TABLE_DEFS};
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
        conn.execute_batch(TABLE_DEFS)?;
        conn.execute_batch(INDEX_DEFS)?;
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}
