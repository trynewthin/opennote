import { create } from "zustand";
import type { Project } from "@/types";
import * as api from "@/services/tauriApi";

interface ProjectState {
    projects: Project[];
    noteCounts: Record<string, number>;
    loading: boolean;
    error: string | null;

    fetchProjects: () => Promise<void>;
    addProject: (name: string, description: string) => Promise<Project>;
    editProject: (id: string, name: string, description: string) => Promise<void>;
    removeProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
    projects: [],
    noteCounts: {},
    loading: false,
    error: null,

    fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
            const projects = await api.getAllProjects();

            // 批量获取各项目笔记数
            const counts: Record<string, number> = {};
            await Promise.all(
                projects.map(async (p) => {
                    counts[p.id] = await api.getProjectNoteCount(p.id);
                })
            );

            set({ projects, noteCounts: counts, loading: false });
        } catch (e) {
            set({ error: String(e), loading: false });
        }
    },

    addProject: async (name, description) => {
        const project = await api.createProject(name, description);
        set((s) => ({
            projects: [project, ...s.projects],
            noteCounts: { ...s.noteCounts, [project.id]: 0 },
        }));
        return project;
    },

    editProject: async (id, name, description) => {
        const updated = await api.updateProject(id, name, description);
        set((s) => ({
            projects: s.projects.map((p) => (p.id === id ? updated : p)),
        }));
    },

    removeProject: async (id) => {
        await api.deleteProject(id);
        set((s) => ({
            projects: s.projects.filter((p) => p.id !== id),
            noteCounts: Object.fromEntries(
                Object.entries(s.noteCounts).filter(([k]) => k !== id)
            ),
        }));
    },
}));
