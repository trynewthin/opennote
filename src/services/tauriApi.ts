import { invoke } from "@tauri-apps/api/core";
import type { Project } from "@/types";

// ─── Project API ───

export async function getAllProjects(): Promise<Project[]> {
    return invoke<Project[]>("get_all_projects");
}

export async function createProject(
    name: string,
    description: string
): Promise<Project> {
    return invoke<Project>("create_project", { name, description });
}

export async function updateProject(
    id: string,
    name: string,
    description: string
): Promise<Project> {
    return invoke<Project>("update_project", { id, name, description });
}

export async function deleteProject(id: string): Promise<void> {
    return invoke<void>("delete_project", { id });
}

export async function getProjectNoteCount(
    projectId: string
): Promise<number> {
    return invoke<number>("get_project_node_count", { projectId });
}
