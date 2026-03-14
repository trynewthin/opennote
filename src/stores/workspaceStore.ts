import { create } from "zustand";
import { workspaceApi } from "@/services/workspaceApi";
import type { AppSettings, ProjectSummary } from "@/types";

interface WorkspaceState {
    currentWorkspace: string | null;
    recentWorkspaces: string[];
    projects: ProjectSummary[];
    folders: string[];
    settings: AppSettings | null;
    loading: boolean;
    error: string | null;
    initialize: () => Promise<AppSettings>;
    openWorkspace: (path: string) => Promise<ProjectSummary[]>;
    chooseWorkspace: () => Promise<string | null>;
    refreshProjects: () => Promise<void>;
    createProject: (name: string, description: string) => Promise<ProjectSummary>;
    updateProject: (projectPath: string, name: string, description: string) => Promise<ProjectSummary>;
    deleteProject: (projectPath: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
    currentWorkspace: null,
    recentWorkspaces: [],
    projects: [],
    folders: [],
    settings: null,
    loading: false,
    error: null,

    initialize: async () => {
        const settings = await workspaceApi.getAppSettings();
        set({
            settings,
            recentWorkspaces: settings.recent_workspaces,
        });
        return settings;
    },

    openWorkspace: async (path) => {
        set({ loading: true, error: null });
        try {
            const projects = await workspaceApi.openWorkspace(path);
            const [settings, folders] = await Promise.all([
                workspaceApi.getAppSettings(),
                workspaceApi.listWorkspaceFolders(),
            ]);
            set({
                currentWorkspace: path,
                projects,
                folders,
                settings,
                recentWorkspaces: settings.recent_workspaces,
                loading: false,
            });
            return projects;
        } catch (error) {
            set({ loading: false, error: String(error) });
            throw error;
        }
    },

    chooseWorkspace: async () => {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const selected = await open({
            directory: true,
            multiple: false,
            title: "Select workspace folder",
        });
        if (!selected || Array.isArray(selected)) {
            return null;
        }
        await get().openWorkspace(selected);
        return selected;
    },

    refreshProjects: async () => {
        const { currentWorkspace } = get();
        if (!currentWorkspace) return;
        const [projects, folders] = await Promise.all([
            workspaceApi.listProjects(),
            workspaceApi.listWorkspaceFolders(),
        ]);
        set({ projects, folders });
    },

    createProject: async (name, description) => {
        const project = await workspaceApi.createProject(name, description);
        set((state) => ({
            projects: [project, ...state.projects].sort((left, right) => right.updated_at - left.updated_at),
        }));
        return project;
    },

    updateProject: async (projectPath, name, description) => {
        const loaded = await workspaceApi.loadProject(projectPath);
        const summary = await workspaceApi.saveProject(projectPath, {
            ...loaded.data,
            name,
            description,
        });
        set((state) => ({
            projects: state.projects
                .map((project) => (project.path === projectPath ? summary : project))
                .sort((left, right) => right.updated_at - left.updated_at),
        }));
        return summary;
    },

    deleteProject: async (projectPath) => {
        await workspaceApi.deleteProject(projectPath);
        set((state) => ({
            projects: state.projects.filter((project) => project.path !== projectPath),
        }));
    },
}));
