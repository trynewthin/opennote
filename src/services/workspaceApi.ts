import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, LoadedProject, NodeResourceMetadata, ProjectData, ProjectSummary, WorkspaceFileEntry } from "@/types";

export const workspaceApi = {
    async getAppSettings(): Promise<AppSettings> {
        return invoke("get_app_settings");
    },

    async updateAppSettings(settings: AppSettings): Promise<AppSettings> {
        return invoke("update_app_settings", { settings });
    },

    async openWorkspace(path: string): Promise<ProjectSummary[]> {
        return invoke("open_workspace", { path });
    },

    async listProjects(): Promise<ProjectSummary[]> {
        return invoke("list_projects");
    },

    async loadProject(projectPath: string): Promise<LoadedProject> {
        return invoke("load_project", { projectPath });
    },

    async saveProject(projectPath: string, data: ProjectData): Promise<ProjectSummary> {
        return invoke("save_project", { projectPath, data });
    },

    async createProject(
        name: string,
        description: string,
        folderPath?: string | null,
    ): Promise<ProjectSummary> {
        return invoke("create_project", { name, description, folderPath });
    },

    async deleteProject(projectPath: string): Promise<void> {
        return invoke("delete_project", { projectPath });
    },

    async copyAttachment(projectPath: string, sourcePath: string): Promise<string> {
        return invoke("copy_attachment", { projectPath, sourcePath });
    },

    async getNodeResourceMetadata(projectPath: string, nodeId: string): Promise<NodeResourceMetadata> {
        return invoke("get_node_resource_metadata", { projectPath, nodeId });
    },

    async readNodeFile(
        projectPath: string,
        nodeId: string,
    ): Promise<{ encoding: string; data: string; mime_type: string | null; file_name: string | null }> {
        return invoke("read_node_file", { projectPath, nodeId });
    },

    async createWorkspaceFolder(folderPath: string): Promise<void> {
        return invoke("create_workspace_folder", { folderPath });
    },

    async listWorkspaceFolders(): Promise<string[]> {
        return invoke("list_workspace_folders");
    },

    async listWorkspaceTree(): Promise<WorkspaceFileEntry[]> {
        return invoke("list_workspace_tree");
    },

    async renameFile(path: string, newName: string): Promise<string> {
        return invoke("rename_file", { path, newName });
    },

    async deleteFile(path: string): Promise<void> {
        return invoke("delete_file", { path });
    },

    async readFileByPath(path: string): Promise<FileContent> {
        return invoke("read_file_by_path", { path });
    },
};

export interface FileContent {
    encoding: string;
    data: string;
    mime_type: string | null;
    file_name: string | null;
}
