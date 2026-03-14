mod application;
mod commands;
mod db;
mod error;
mod format;
mod models;

use application::{CreateProjectRequestCache, CurrentWorkspace};
use db::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let exe_dir = std::env::current_exe()
        .expect("Failed to get executable path")
        .parent()
        .expect("Failed to get executable directory")
        .to_path_buf();
    let db_path = exe_dir.join("data").join("opennote.db");

    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).expect("Failed to create data directory");
    }

    let database = Database::new(db_path.to_str().unwrap()).expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .manage(database)
        .manage(CurrentWorkspace::default())
        .manage(CreateProjectRequestCache::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::settings::get_app_settings,
            commands::settings::update_app_settings,
            commands::workspace::open_workspace,
            commands::workspace::list_projects,
            commands::workspace::load_project,
            commands::workspace::save_project,
            commands::workspace::create_project,
            commands::workspace::delete_project,
            commands::workspace::copy_attachment,
            commands::workspace::create_workspace_folder,
            commands::workspace::list_workspace_folders,
            commands::node::get_node_resource_metadata,
            commands::node::read_node_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
