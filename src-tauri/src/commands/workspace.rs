use tauri::{Emitter, State};

use crate::application::{
    AttachmentService, CurrentWorkspace, FileService, ProjectService, WorkspaceService,
};
use crate::commands::{into_command_result, CommandResult};
use crate::db::Database;
use crate::events;
use crate::format::{is_text_mime, ProjectData};
use crate::models::{FileContent, LoadedProject, WorkspaceFileEntry, WorkspaceProjectSummary};

#[tauri::command]
pub fn open_workspace(
    app: tauri::AppHandle,
    db: State<Database>,
    current_workspace: State<CurrentWorkspace>,
    path: String,
) -> CommandResult<Vec<WorkspaceProjectSummary>> {
    into_command_result((|| -> crate::application::AppResult<Vec<WorkspaceProjectSummary>> {
        let ws = WorkspaceService::new(current_workspace.inner());
        ws.open_workspace(db.inner(), &path)?;
        let projects = ProjectService::new(&ws).scan_workspace()?;
        let _ = app.emit(events::WORKSPACE_OPENED, events::WorkspaceOpenedPayload { path });
        Ok(projects)
    })())
}

#[tauri::command]
pub fn list_projects(
    current_workspace: State<CurrentWorkspace>,
) -> CommandResult<Vec<WorkspaceProjectSummary>> {
    let ws = WorkspaceService::new(current_workspace.inner());
    into_command_result(ProjectService::new(&ws).scan_workspace())
}

#[tauri::command]
pub fn load_project(
    current_workspace: State<CurrentWorkspace>,
    project_path: String,
) -> CommandResult<LoadedProject> {
    let ws = WorkspaceService::new(current_workspace.inner());
    into_command_result(ProjectService::new(&ws).load_project(&project_path))
}

#[tauri::command]
pub fn save_project(
    app: tauri::AppHandle,
    current_workspace: State<CurrentWorkspace>,
    project_path: String,
    data: ProjectData,
) -> CommandResult<WorkspaceProjectSummary> {
    let ws = WorkspaceService::new(current_workspace.inner());
    let result = ProjectService::new(&ws).save_project(&project_path, &data);
    if let Ok(ref summary) = result {
        let _ = app.emit(events::PROJECT_SAVED, events::ProjectMutatedPayload {
            path: summary.path.clone(),
            name: summary.name.clone(),
        });
    }
    into_command_result(result)
}

#[tauri::command]
pub fn create_project(
    app: tauri::AppHandle,
    current_workspace: State<CurrentWorkspace>,
    name: String,
    description: String,
    folder_path: Option<String>,
) -> CommandResult<WorkspaceProjectSummary> {
    let ws = WorkspaceService::new(current_workspace.inner());
    let result = ProjectService::new(&ws).create_project(
        &name,
        &description,
        folder_path.as_deref(),
    );
    if let Ok(ref summary) = result {
        let _ = app.emit(events::PROJECT_CREATED, events::ProjectMutatedPayload {
            path: summary.path.clone(),
            name: summary.name.clone(),
        });
    }
    into_command_result(result)
}

#[tauri::command]
pub fn delete_project(
    app: tauri::AppHandle,
    current_workspace: State<CurrentWorkspace>,
    project_path: String,
) -> CommandResult<()> {
    let ws = WorkspaceService::new(current_workspace.inner());
    let result = ProjectService::new(&ws).delete_project(&project_path);
    if result.is_ok() {
        let _ = app.emit(events::PROJECT_DELETED, events::ProjectDeletedPayload {
            path: project_path,
        });
    }
    into_command_result(result)
}

#[tauri::command]
pub fn copy_attachment(
    current_workspace: State<CurrentWorkspace>,
    project_path: String,
    source_path: String,
) -> CommandResult<String> {
    let ws = WorkspaceService::new(current_workspace.inner());
    into_command_result(
        AttachmentService::new(&ws).copy_attachment(&project_path, &source_path),
    )
}

#[tauri::command]
pub fn create_workspace_folder(
    app: tauri::AppHandle,
    current_workspace: State<CurrentWorkspace>,
    folder_path: String,
) -> CommandResult<()> {
    let ws = WorkspaceService::new(current_workspace.inner());
    let result = FileService::new(&ws).create_folder(&folder_path);
    if result.is_ok() {
        let _ = app.emit(events::FOLDER_CREATED, events::FolderCreatedPayload {
            path: folder_path,
        });
    }
    into_command_result(result)
}

#[tauri::command]
pub fn list_workspace_folders(
    current_workspace: State<CurrentWorkspace>,
) -> CommandResult<Vec<String>> {
    let ws = WorkspaceService::new(current_workspace.inner());
    into_command_result(FileService::new(&ws).list_folders())
}

#[tauri::command]
pub fn list_workspace_tree(
    current_workspace: State<CurrentWorkspace>,
) -> CommandResult<Vec<WorkspaceFileEntry>> {
    let ws = WorkspaceService::new(current_workspace.inner());
    into_command_result(FileService::new(&ws).scan_all_files())
}

#[tauri::command]
pub fn rename_file(
    app: tauri::AppHandle,
    current_workspace: State<CurrentWorkspace>,
    path: String,
    new_name: String,
) -> CommandResult<String> {
    let ws = WorkspaceService::new(current_workspace.inner());
    let result = FileService::new(&ws).rename_file(&path, &new_name);
    if let Ok(ref new_path) = result {
        let _ = app.emit(events::FILE_RENAMED, events::FileRenamedPayload {
            old_path: path,
            new_path: new_path.clone(),
        });
    }
    into_command_result(result)
}

#[tauri::command]
pub fn delete_file(
    app: tauri::AppHandle,
    current_workspace: State<CurrentWorkspace>,
    path: String,
) -> CommandResult<()> {
    let ws = WorkspaceService::new(current_workspace.inner());
    let result = FileService::new(&ws).delete_file(&path);
    if result.is_ok() {
        let _ = app.emit(events::FILE_DELETED, events::FileDeletedPayload {
            path: path.clone(),
        });
    }
    into_command_result(result)
}

#[tauri::command]
pub fn read_file_by_path(
    current_workspace: State<CurrentWorkspace>,
    path: String,
) -> CommandResult<FileContent> {
    into_command_result((|| -> crate::application::AppResult<FileContent> {
        let ws = WorkspaceService::new(current_workspace.inner());
        let resolved = ws.ensure_within_workspace(&path)?;
        let file_name = resolved
            .file_name()
            .and_then(|name| name.to_str())
            .map(String::from);
        let mime = mime_guess::from_path(&resolved)
            .first_or_octet_stream()
            .essence_str()
            .to_string();

        if is_text_mime(&mime) {
            let text = std::fs::read_to_string(&resolved)?;
            Ok(FileContent {
                encoding: "text".into(),
                data: text,
                mime_type: Some(mime),
                file_name,
            })
        } else {
            use base64::Engine;
            let bytes = std::fs::read(&resolved)?;
            let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
            Ok(FileContent {
                encoding: "base64".into(),
                data: b64,
                mime_type: Some(mime),
                file_name,
            })
        }
    })())
}
