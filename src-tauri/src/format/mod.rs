mod json_format;
mod path_resolver;
mod project_data;

use crate::error::AppResult;

pub use json_format::JsonOnFormat;
pub use path_resolver::{PathResolver, RelativePathResolver};
pub use project_data::ProjectData;

pub trait OnFormat: Send + Sync {
    fn serialize(&self, data: &ProjectData) -> AppResult<String>;
    fn deserialize(&self, raw: &str) -> AppResult<ProjectData>;
}
