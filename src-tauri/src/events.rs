use serde::Serialize;

// Event name constants — must match what the frontend listens to.
// Using a URI-like scheme to namespace events and avoid collisions.
pub const WORKSPACE_OPENED: &str = "workspace://opened";
pub const PROJECT_CREATED:  &str = "workspace://project-created";
pub const PROJECT_SAVED:    &str = "workspace://project-saved";
pub const PROJECT_DELETED:  &str = "workspace://project-deleted";
pub const FILE_RENAMED:     &str = "workspace://file-renamed";
pub const FILE_DELETED:     &str = "workspace://file-deleted";
pub const FOLDER_CREATED:   &str = "workspace://folder-created";

#[derive(Clone, Serialize)]
pub struct WorkspaceOpenedPayload {
    pub path: String,
}

/// Payload for project create / save events.
#[derive(Clone, Serialize)]
pub struct ProjectMutatedPayload {
    pub path: String,
    pub name: String,
}

#[derive(Clone, Serialize)]
pub struct ProjectDeletedPayload {
    pub path: String,
}

#[derive(Clone, Serialize)]
pub struct FileRenamedPayload {
    pub old_path: String,
    pub new_path: String,
}

#[derive(Clone, Serialize)]
pub struct FileDeletedPayload {
    pub path: String,
}

#[derive(Clone, Serialize)]
pub struct FolderCreatedPayload {
    pub path: String,
}
