import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGraphStore } from "@/stores/graphStore";
import { useProjectStore } from "@/stores/projectStore";
import { useThemeStore } from "@/stores/themeStore";
import { configService } from "@/services/configService";
import { ArrowLeft, Sun, Moon, ZoomIn, ZoomOut, Locate } from "lucide-react";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { AddContentDialog } from "@/components/graph/AddContentDialog";
import { EditContentDialog } from "@/components/graph/EditContentDialog";

import "./GraphPage.css";

export function GraphPage() {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { loadGraphData, zoomIn, zoomOut, resetView, setTransform } = useGraphStore();
    const { projects, fetchProjects } = useProjectStore();
    const project = projects.find((p) => p.id === projectId);
    const projectName = project?.name ?? "—";
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === "dark";

    // Keep a ref to current project for cleanup
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

    // Restore viewport from project config
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
    }, [project?.id]); // only on project change, not every config update

    // Save viewport to project config on unmount
    useEffect(() => {
        return () => {
            const p = projectRef.current;
            if (!p) return;
            const { transform } = useGraphStore.getState();
            configService.patch("project", p.id, p.config, {
                viewX: transform.x,
                viewY: transform.y,
                viewScale: transform.scale,
            }).catch(console.error);
        };
    }, [projectId]);

    if (!projectId) {
        return <div>Project not found</div>;
    }

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background relative">
            {/* ── Floating toolbar ── */}
            <header className="graph-header">
                {/* Left: back + project name */}
                <div className="graph-toolbar graph-toolbar--left">
                    <button
                        className="graph-toolbar__btn"
                        onClick={() => navigate("/")}
                        title="返回项目列表"
                    >
                        <ArrowLeft className="graph-toolbar__icon" />
                    </button>
                    <span className="graph-toolbar__divider" />
                    <span className="graph-toolbar__title">{projectName}</span>
                </div>

                {/* Right: zoom + theme */}
                <div className="graph-toolbar graph-toolbar--right">
                    <button className="graph-toolbar__btn" onClick={zoomIn} title="放大">
                        <ZoomIn className="graph-toolbar__icon" />
                    </button>
                    <button className="graph-toolbar__btn" onClick={zoomOut} title="缩小">
                        <ZoomOut className="graph-toolbar__icon" />
                    </button>
                    <button className="graph-toolbar__btn" onClick={resetView} title="重置视图">
                        <Locate className="graph-toolbar__icon" />
                    </button>
                    <span className="graph-toolbar__divider" />
                    <button
                        className="graph-toolbar__btn"
                        onClick={toggleTheme}
                        title={isDark ? "切换浅色模式" : "切换深色模式"}
                    >
                        {isDark
                            ? <Sun className="graph-toolbar__icon graph-toolbar__icon--sun" />
                            : <Moon className="graph-toolbar__icon graph-toolbar__icon--moon" />}
                    </button>
                </div>
            </header>

            <main className="flex-1 relative w-full overflow-hidden">
                <GraphCanvas />
            </main>

            <AddContentDialog />
            <EditContentDialog />
        </div>
    );
}
