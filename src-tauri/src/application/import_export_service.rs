use crate::application::{AppResult, GraphService};
use crate::db::Database;
use crate::error::AppError;
use crate::models::ProjectExport;
use chrono::Utc;

use std::fs;
use std::io::{Read, Write};

pub struct ImportExportService<'a> {
    db: &'a Database,
}

impl<'a> ImportExportService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn export_project_on(&self, project_id: &str, file_path: &str) -> AppResult<()> {
        let project = self.db.get_project_export_meta(project_id)?;
        let graph = GraphService::new(self.db).get_project_graph(project_id)?;
        let data = ProjectExport {
            version: "1.0".to_string(),
            exported_at: Utc::now().to_rfc3339(),
            project,
            graph,
        };
        let json = serde_json::to_string_pretty(&data)?;

        let file = fs::File::create(file_path)?;
        let mut zip = zip::ZipWriter::new(file);
        let options = zip::write::FileOptions::<()>::default()
            .compression_method(zip::CompressionMethod::Deflated);

        zip.start_file("manifest.json", options)?;
        zip.write_all(json.as_bytes())?;
        zip.finish()?;

        Ok(())
    }

    pub fn import_project_on(&self, file_path: &str) -> AppResult<String> {
        let file = fs::File::open(file_path)?;
        let mut archive = zip::ZipArchive::new(file)?;

        let mut manifest = archive
            .by_name("manifest.json")
            .map_err(AppError::invalid_archive)?;
        let mut json = String::new();
        manifest.read_to_string(&mut json)?;
        drop(manifest);

        let data: ProjectExport =
            serde_json::from_str(&json).map_err(AppError::invalid_manifest)?;

        self.db.import_project_data(&data).map_err(Into::into)
    }
}
