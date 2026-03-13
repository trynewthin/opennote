use crate::error::AppResult;

pub mod node;
pub mod settings;
pub mod workspace;

pub type CommandResult<T> = Result<T, String>;

pub fn into_command_result<T>(result: AppResult<T>) -> CommandResult<T> {
    result.map_err(|error| error.to_string())
}
