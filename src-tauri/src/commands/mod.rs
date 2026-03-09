use crate::error::AppResult;

pub mod content;
pub mod group;
pub mod import_export;
pub mod link;
pub mod node;
pub mod project;

pub type CommandResult<T> = Result<T, String>;

pub fn into_command_result<T>(result: AppResult<T>) -> CommandResult<T> {
    result.map_err(|error| error.to_string())
}
