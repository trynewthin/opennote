import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
    // 初始化：从 localStorage 读取，默认暗色
    const stored = localStorage.getItem("opennote-theme") as Theme | null;
    const initial: Theme = stored ?? "dark";

    // 同步到 DOM
    document.documentElement.classList.toggle("dark", initial === "dark");

    return {
        theme: initial,

        toggleTheme: () =>
            set((s) => {
                const next: Theme = s.theme === "dark" ? "light" : "dark";
                document.documentElement.classList.toggle("dark", next === "dark");
                localStorage.setItem("opennote-theme", next);
                return { theme: next };
            }),

        setTheme: (theme) =>
            set(() => {
                document.documentElement.classList.toggle("dark", theme === "dark");
                localStorage.setItem("opennote-theme", theme);
                return { theme };
            }),
    };
});
