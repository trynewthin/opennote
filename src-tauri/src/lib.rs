mod models;
mod db;
mod commands;

use db::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 数据库文件存放在程序安装目录下的 data/ 子目录
    let exe_dir = std::env::current_exe()
        .expect("Failed to get executable path")
        .parent()
        .expect("Failed to get executable directory")
        .to_path_buf();
    let db_path = exe_dir.join("data").join("opennote.db");

    // 确保目录存在
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).expect("Failed to create data directory");
    }

    let database = Database::new(db_path.to_str().unwrap())
        .expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(database)
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
            // 项目
            commands::project::get_all_projects,
            commands::project::create_project,
            commands::project::update_project,
            commands::project::delete_project,
            commands::project::get_project_note_count,
            // 笔记 + 图谱
            commands::note::get_graph_data,
            commands::note::create_note,
            commands::note::update_note,
            commands::note::update_note_position,
            commands::note::delete_note,
            commands::note::search_notes,
            commands::note::get_ancestors,
            commands::note::move_note,
            commands::note::batch_delete_notes,
            commands::note::batch_move_notes,
            commands::note::get_children_counts,
            // 属性
            commands::property::set_property,
            commands::property::get_properties,
            commands::property::delete_property,
            // 关联
            commands::link::create_link,
            commands::link::update_link,
            commands::link::delete_link,
            // 分组
            commands::group::create_group,
            commands::group::update_group,
            commands::group::delete_group,
            commands::group::add_note_to_group,
            commands::group::remove_note_from_group,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
