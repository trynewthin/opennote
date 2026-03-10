import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGraphStore } from "@/stores/graphStore";
import { useProjectStore } from "@/stores/projectStore";
import { useThemeStore } from "@/stores/themeStore";
import { configService } from "@/services/configService";
import { ArrowLeft, Sun, Moon, ZoomIn, ZoomOut, Locate } from "lucide-react";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { EditContentDialog } from "@/components/graph/EditContentDialog";

import "./GraphPage.css";

export function GraphPage() {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { loadGraphData, zoomIn, zoomOut, resetView, setTransform } = useGraphStore();
    const { projects, fetchProjects } = useProjectStore();
    const project = projects.find((item) => item.id === projectId);
    const projectName = project?.name ?? "Untitled Project";
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === "dark";

    const projectRef = useRef(project);
    projectRef.current = project;

    useEffect(() => {
        if (projects.length === 0) fetchProjects();
    }, [projects.length, fetchProjects]);

    useEffect(() => {
        if (projectId) {
            loadGraphData(projectId);
        }
    }, [projectId, loadGraphData]);

    useEffect(() => {
        if (!project?.config) return;
        const cfg = configService.parse<{ viewX?: number; viewY?: number; viewScale?: number }>(project.config);
        if (cfg && (cfg.viewX != null || cfg.viewY != null || cfg.viewScale != null)) {
            setTransform({
                x: cfg.viewX ?? 0,
                y: cfg.viewY ?? 0,
                scale: cfg.viewScale ?? 1,
            });
        }
    }, [project?.id, project?.config, setTransform]);

    useEffect(() => {
        return () => {
            const currentProject = projectRef.current;
            if (!currentProject) return;
            const { transform } = useGraphStore.getState();
            configService
                .patch("project", currentProject.id, currentProject.config, {
                    viewX: transform.x,
                    viewY: transform.y,
                    viewScale: transform.scale,
                })
                .catch(console.error);
        };
    }, [projectId]);

    if (!projectId) {
        return <div>Project not found</div>;
    }

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background">
            <header className="graph-header">
                <div className="graph-toolbar graph-toolbar--left">
                    <button className="graph-toolbar__btn" onClick={() => navigate("/")} title="Back to projects">
                        <ArrowLeft className="graph-toolbar__icon" />
                    </button>
                    <span className="graph-toolbar__divider" />
                    <span className="graph-toolbar__title">{projectName}</span>
                </div>

                <div className="graph-toolbar graph-toolbar--right">
                    <button className="graph-toolbar__btn" onClick={zoomIn} title="Zoom in">
                        <ZoomIn className="graph-toolbar__icon" />
                    </button>
                    <button className="graph-toolbar__btn" onClick={zoomOut} title="Zoom out">
                        <ZoomOut className="graph-toolbar__icon" />
                    </button>
                    <button className="graph-toolbar__btn" onClick={resetView} title="Reset view">
                        <Locate className="graph-toolbar__icon" />
                    </button>
                    <span className="graph-toolbar__divider" />
                    <button
                        className="graph-toolbar__btn"
                        onClick={toggleTheme}
                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
