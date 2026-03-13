import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { hydrateLanguage } from "./i18n";
import { WorkspacePage } from "./pages/WorkspacePage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { GraphPage } from "./pages/GraphPage";
import { useThemeStore } from "./stores/themeStore";
import { useWorkspaceStore } from "./stores/workspaceStore";

function App() {
    const initialize = useWorkspaceStore((state) => state.initialize);
    const hydrateTheme = useThemeStore((state) => state.hydrateTheme);

    useEffect(() => {
        initialize()
            .then((settings) => {
                hydrateTheme(settings.theme);
                hydrateLanguage(settings.language);
            })
            .catch((error) => {
                console.error("Failed to initialize app settings:", error);
            });
    }, [hydrateTheme, initialize]);

    return (
        <Routes>
            <Route path="/" element={<WorkspacePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/graph" element={<GraphPage />} />
        </Routes>
    );
}

export default App;
