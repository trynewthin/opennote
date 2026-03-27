use serde::Serialize;

use crate::error::{AppError, AppResult};

pub mod node;
pub mod settings;
pub mod workspace;

/// Structured error returned from all Tauri IPC commands.
///
/// Tauri serializes the `Err` variant of `CommandResult` as JSON, so the
/// frontend receives `{ code: "NOT_FOUND", message: "Node not found: abc" }`
/// instead of a raw string. This allows the frontend to branch on `code`
/// without brittle string matching.
#[derive(Debug, Serialize)]
pub struct CommandError {
    /// Machine-readable error category. Maps 1-to-1 with `AppError` variants.
    pub code: &'static str,
    /// Human-readable description forwarded from the underlying `AppError`.
    pub message: String,
}

pub type CommandResult<T> = Result<T, CommandError>;

pub fn into_command_result<T>(result: AppResult<T>) -> CommandResult<T> {
    result.map_err(|error| CommandError {
        code: error_code(&error),
        message: error.to_string(),
    })
}

fn error_code(error: &AppError) -> &'static str {
    match error {
        AppError::Database(_)         => "DATABASE_ERROR",
        AppError::Io(_)               => "IO_ERROR",
        AppError::Json(_)             => "JSON_ERROR",
        AppError::Zip(_)              => "ZIP_ERROR",
        AppError::NotFound(_)         => "NOT_FOUND",
        AppError::Validation(_)       => "VALIDATION_ERROR",
        AppError::InvalidWorkspace(_) => "INVALID_WORKSPACE",
    }
}
