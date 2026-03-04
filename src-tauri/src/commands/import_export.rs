use crate::db::Database;
use crate::models::ProjectExport;
use tauri::State;

use std::fs;
use std::io::{Read, Write};

/// 导出项目为 .on 文件（zip 包含 manifest.json）
#[tauri::command]
pub fn export_project_on(
    db: State<Database>,
    project_id: String,
    file_path: String,
) -> Result<(), String> {
    // 1. 获取完整导出数据
    let data = db
        .export_project_data(&project_id)
        .map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;

    // 2. 创建 zip
    let file = fs::File::create(&file_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);

    let options = zip::write::FileOptions::<()>::default()
        .compression_method(zip::CompressionMethod::Deflated);

    zip.start_file("manifest.json", options)
        .map_err(|e| e.to_string())?;
    zip.write_all(json.as_bytes()).map_err(|e| e.to_string())?;

    // TODO: 遍历附件目录，将附件文件也打进 zip

    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

/// 导入 .on 文件
#[tauri::command]
pub fn import_project_on(db: State<Database>, file_path: String) -> Result<String, String> {
    // 1. 读取 zip
    let file = fs::File::open(&file_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    // 2. 读取 manifest.json
    let mut manifest = archive
        .by_name("manifest.json")
        .map_err(|e| format!("无效的 .on 文件: {}", e))?;
    let mut json_str = String::new();
    manifest
        .read_to_string(&mut json_str)
        .map_err(|e| e.to_string())?;
    drop(manifest);

    let data: ProjectExport =
        serde_json::from_str(&json_str).map_err(|e| format!("解析失败: {}", e))?;

    // 3. 导入到数据库
    let project_id = db.import_project_data(&data).map_err(|e| e.to_string())?;

    // TODO: 解压附件文件到附件目录

    Ok(project_id)
}
