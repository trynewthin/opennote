use std::fmt::{self, Display, Formatter};

#[derive(Debug)]
pub enum AppError {
    Database(rusqlite::Error),
    Io(std::io::Error),
    Json(serde_json::Error),
    Zip(zip::result::ZipError),
    NotFound(String),
    Validation(String),
    InvalidWorkspace(String),
}

pub type AppResult<T> = Result<T, AppError>;

impl Display for AppError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Database(error) => error.fmt(f),
            Self::Io(error) => error.fmt(f),
            Self::Json(error) => error.fmt(f),
            Self::Zip(error) => error.fmt(f),
            Self::NotFound(message)
            | Self::Validation(message)
            | Self::InvalidWorkspace(message) => message.fmt(f),
        }
    }
}

impl std::error::Error for AppError {}

impl From<rusqlite::Error> for AppError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Database(error)
    }
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        Self::Io(error)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(error: serde_json::Error) -> Self {
        Self::Json(error)
    }
}

impl From<zip::result::ZipError> for AppError {
    fn from(error: zip::result::ZipError) -> Self {
        Self::Zip(error)
    }
}
