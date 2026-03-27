use crate::error::{AppError, AppResult};

use super::{OnFormat, ProjectData};

#[derive(Default)]
pub struct JsonOnFormat;

impl OnFormat for JsonOnFormat {
    fn serialize(&self, data: &ProjectData) -> AppResult<String> {
        serde_json::to_string_pretty(data).map_err(Into::into)
    }

    fn deserialize(&self, raw: &str) -> AppResult<ProjectData> {
        let value: serde_json::Value = serde_json::from_str(raw)?;
        let version = value
            .get("on_version")
            .and_then(|value| value.as_str())
            .unwrap_or("1");

        match version {
            "1" => serde_json::from_value(value).map_err(Into::into),
            other => Err(AppError::Validation(format!(
                "Unsupported .on version: {}. Please update OpenNote.",
                other
            ))),
        }
    }
}
