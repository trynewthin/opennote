use crate::application::ImportExportService;
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use tauri::State;

#[tauri::command]
pub fn export_project_on(
    db: State<Database>,
    project_id: String,
    file_path: String,
) -> CommandResult<()> {
    into_command_result(
        ImportExportService::new(db.inner()).export_project_on(&project_id, &file_path),
    )
}

#[tauri::command]
pub fn import_project_on(db: State<Database>, file_path: String) -> CommandResult<String> {
    into_command_result(ImportExportService::new(db.inner()).import_project_on(&file_path))
}
