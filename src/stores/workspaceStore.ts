import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import { workspaceApi } from "@/services/workspaceApi";
import type { AppSettings, ProjectSummary, WorkspaceFileEntry } from "@/types";

interface WorkspaceState {
    currentWorkspace: string | null;
    recentWorkspaces: string[];
    projects: ProjectSummary[];
    folders: string[];
    fileTree: WorkspaceFileEntry[];
    settings: AppSettings | null;
    loading: boolean;
    error: string | null;
    initialize: () => Promise<AppSettings>;
    openWorkspace: (path: string) => Promise<ProjectSummary[]>;
    chooseWorkspace: () => Promise<string | null>;
    refreshProjects: () => Promise<void>;
    createProject: (
        name: string,
        description: string,
        folderPath?: string | null,
    ) => Promise<ProjectSummary>;
    updateProject: (projectPath: string, name: string, description: string) => Promise<ProjectSummary>;
    deleteProject: (projectPath: string) => Promise<void>;
    removeRecentWorkspace: (path: string) => Promise<void>;
    /** Subscribe to backend IPC mutation events. Returns an unlisten function. */
    subscribeToEvents: () => Promise<() => void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
    currentWorkspace: null,
    recentWorkspaces: [],
    projects: [],
    folders: [],
    fileTree: [],
    settings: null,
    loading: false,
    error: null,

    initialize: async () => {
        const settings = await workspaceApi.getAppSettings();
        set({
            settings,
            recentWorkspaces: settings.recent_workspaces,
        });
        if (settings.last_workspace) {
            await get().openWorkspace(settings.last_workspace);
        }
        return settings;
    },

    openWorkspace: async (path) => {
        set({ loading: true, error: null });
        try {
            const [projects, settings, folders, fileTree] = await Promise.all([
                workspaceApi.openWorkspace(path),
                workspaceApi.getAppSettings(),
                workspaceApi.listWorkspaceFolders(),
                workspaceApi.listWorkspaceTree(),
            ]);
            set({
                currentWorkspace: path,
                projects,
                folders,
                fileTree,
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
        const [projects, folders, fileTree] = await Promise.all([
            workspaceApi.listProjects(),
            workspaceApi.listWorkspaceFolders(),
            workspaceApi.listWorkspaceTree(),
        ]);
        set({ projects, folders, fileTree });
    },

    createProject: async (name, description, folderPath) => {
        // Backend emits workspace://project-created after creation.
        // We still return the project for immediate UI feedback.
        return workspaceApi.createProject(name, description, folderPath);
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
        // Backend emits workspace://project-deleted — store will also remove locally.
        set((state) => ({
            projects: state.projects.filter((project) => project.path !== projectPath),
        }));
    },

    removeRecentWorkspace: async (path) => {
        const currentSettings = get().settings ?? await workspaceApi.getAppSettings();
        const nextSettings = {
            ...currentSettings,
            recent_workspaces: currentSettings.recent_workspaces.filter((item) => item !== path),
        };
        const saved = await workspaceApi.updateAppSettings(nextSettings);
        set({
            settings: saved,
            recentWorkspaces: saved.recent_workspaces,
        });
    },

    subscribeToEvents: async () => {
        // Listen for backend mutation events and sync local state.
        const unlistenCreated = await listen<{ path: string; name: string }>(
            "workspace://project-created",
            () => get().refreshProjects(),
        );

        const unlistenDeleted = await listen<{ path: string }>(
            "workspace://project-deleted",
            (event) =>
                set((state) => ({
                    projects: state.projects.filter((p) => p.path !== event.payload.path),
                })),
        );

        const unlistenSaved = await listen<{ path: string; name: string }>(
            "workspace://project-saved",
            () => get().refreshProjects(),
        );

        return () => {
            unlistenCreated();
            unlistenDeleted();
            unlistenSaved();
        };
    },
}));
