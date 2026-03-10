mod application;
mod commands;
mod db;
mod error;
mod models;

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
            commands::project::get_all_projects,
            commands::project::create_project,
            commands::project::update_project,
            commands::project::delete_project,
            commands::project::get_project_node_count,
            commands::project::update_project_config,
            commands::node::get_graph_data,
            commands::node::create_node,
            commands::node::update_node,
            commands::node::update_node_position,
            commands::node::delete_node,
            commands::node::search_nodes,
            commands::node::batch_delete_nodes,
            commands::node::update_node_view_config,
            commands::node::update_node_semantic_config,
            commands::node::get_node_resource_metadata,
            commands::relation::create_relation,
            commands::relation::update_relation,
            commands::relation::delete_relation,
            commands::relation::update_relation_view_config,
            commands::relation::update_relation_semantic_config,
            commands::group::create_group,
            commands::group::update_group,
            commands::group::delete_group,
            commands::group::add_node_to_group,
            commands::group::remove_node_from_group,
            commands::import_export::export_project_on,
            commands::import_export::import_project_on,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
