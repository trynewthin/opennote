import { create } from "zustand";
import { workspaceApi } from "@/services/workspaceApi";

export type Theme = "light" | "dark";

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    hydrateTheme: (theme: Theme | null | undefined) => void;
}

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
}

async function persistTheme(theme: Theme) {
    try {
        const settings = await workspaceApi.getAppSettings();
        await workspaceApi.updateAppSettings({ ...settings, theme });
    } catch (error) {
        console.error("Failed to persist theme:", error);
    }
}

const initialTheme: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applyTheme(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
    theme: initialTheme,

    toggleTheme: () =>
        set((state) => {
            const next: Theme = state.theme === "dark" ? "light" : "dark";
            applyTheme(next);
            void persistTheme(next);
            return { theme: next };
        }),

    setTheme: (theme) =>
        set(() => {
            applyTheme(theme);
            void persistTheme(theme);
            return { theme };
        }),

    hydrateTheme: (theme) =>
        set((state) => {
            const next = theme ?? state.theme;
            applyTheme(next);
            return { theme: next };
        }),
}));
