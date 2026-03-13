use crate::error::{AppError, AppResult};

use super::{OnFormat, ProjectData};

#[derive(Default)]
pub struct JsonOnFormat;

impl OnFormat for JsonOnFormat {
    fn serialize(&self, data: &ProjectData) -> AppResult<String> {
        serde_json::to_string_pretty(data).map_err(Into::into)
    }

    fn deserialize(&self, raw: &str) -> AppResult<ProjectData> {
        let data: ProjectData = serde_json::from_str(raw)?;
        if data.on_version != "1" {
            return Err(AppError::Validation(format!(
                "Unsupported .on version: {}",
                data.on_version
            )));
        }
        Ok(data)
    }
}
