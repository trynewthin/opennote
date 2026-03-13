import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGraphStore } from "@/stores/graphStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useThemeStore } from "@/stores/themeStore";
import { configService } from "@/services/configService";
import { ArrowLeft, Sun, Moon, ZoomIn, ZoomOut } from "lucide-react";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { EditContentDialog } from "@/components/graph/EditContentDialog";
import { useKeybindings } from "@/hooks/useKeybindings";

import "./GraphPage.css";

export function GraphPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const projectPath = searchParams.get("project");
    const decodedProjectPath = useMemo(() => (projectPath ? decodeURIComponent(projectPath) : null), [projectPath]);
    const { currentWorkspace } = useWorkspaceStore();
    const { loadProject, projectName, projectConfig, zoomIn, zoomOut, setTransform, transform, persistProjectConfig } = useGraphStore();
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === "dark";
    const transformRef = useRef(transform);
    useKeybindings();

    transformRef.current = transform;

    useEffect(() => {
        if (!currentWorkspace) {
            navigate("/");
            return;
        }
        if (decodedProjectPath) {
            void loadProject(decodedProjectPath);
        }
    }, [currentWorkspace, decodedProjectPath, loadProject, navigate]);

    useEffect(() => {
        const cfg = configService.parse<{ viewX?: number; viewY?: number; viewScale?: number }>(projectConfig, {});
        if (cfg && (cfg.viewX != null || cfg.viewY != null || cfg.viewScale != null)) {
            setTransform({
                x: cfg.viewX ?? 0,
                y: cfg.viewY ?? 0,
                scale: cfg.viewScale ?? 1,
            });
        }
    }, [projectConfig, setTransform]);

    useEffect(() => {
        return () => {
            void persistProjectConfig({
                viewX: transformRef.current.x,
                viewY: transformRef.current.y,
                viewScale: transformRef.current.scale,
            });
        };
    }, [persistProjectConfig]);

    if (!decodedProjectPath) {
        return <div>{t("graph.projectNotFound")}</div>;
    }

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background">
            <header className="graph-header">
                <div className="graph-toolbar graph-toolbar--left">
                    <button className="graph-toolbar__btn" onClick={() => navigate("/projects")} title={t("graph.backToProjects")}>
                        <ArrowLeft className="graph-toolbar__icon" />
                    </button>
                    <span className="graph-toolbar__divider" />
                    <span className="graph-toolbar__title">{projectName || t("graph.untitledProject")}</span>
                </div>

                <div className="graph-toolbar graph-toolbar--right">
                    <button className="graph-toolbar__btn" onClick={zoomIn} title={t("graph.zoomIn")}>
                        <ZoomIn className="graph-toolbar__icon" />
                    </button>
                    <button className="graph-toolbar__btn" onClick={zoomOut} title={t("graph.zoomOut")}>
                        <ZoomOut className="graph-toolbar__icon" />
                    </button>
                    <span className="graph-toolbar__divider" />
                    <button
                        className="graph-toolbar__btn"
                        onClick={toggleTheme}
                        title={isDark ? t("graph.switchToLight") : t("graph.switchToDark")}
                    >
                        {isDark ? (
                            <Sun className="graph-toolbar__icon graph-toolbar__icon--sun" />
                        ) : (
                            <Moon className="graph-toolbar__icon graph-toolbar__icon--moon" />
                        )}
                    </button>
                </div>
            </header>

            <main className="relative flex-1 overflow-hidden">
                <GraphCanvas />
            </main>

            <EditContentDialog />
        </div>
    );
}
