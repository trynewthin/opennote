use crate::application::AppResult;
use crate::db::Database;
use crate::models::AppSettings;

pub struct SettingsService<'a> {
    db: &'a Database,
}

impl<'a> SettingsService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn get(&self) -> AppResult<AppSettings> {
        self.db.get_settings().map_err(Into::into)
    }

    pub fn save(&self, settings: &AppSettings) -> AppResult<AppSettings> {
        self.db.save_settings(settings).map_err(Into::into)
    }
}
