use crate::application::SettingsService;
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::models::AppSettings;
use tauri::State;

#[tauri::command]
pub fn get_app_settings(db: State<Database>) -> CommandResult<AppSettings> {
    into_command_result(SettingsService::new(db.inner()).get())
}

#[tauri::command]
pub fn update_app_settings(
    db: State<Database>,
    settings: AppSettings,
) -> CommandResult<AppSettings> {
    into_command_result(SettingsService::new(db.inner()).save(&settings))
}
