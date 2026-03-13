pub const TABLE_DEFS: &str = "
CREATE TABLE IF NOT EXISTS settings (
    id                INTEGER PRIMARY KEY CHECK (id = 1),
    language          TEXT,
    theme             TEXT,
    recent_workspaces TEXT NOT NULL DEFAULT '[]'
);
";
