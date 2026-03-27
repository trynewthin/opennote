import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useGraphStore } from "@/stores/graphStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { configService } from "@/services/configService";
import { flushPendingSave } from "@/lib/debouncedPersist";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { EditContentDialog } from "@/components/graph/EditContentDialog";
import { useKeybindings } from "@/hooks/useKeybindings";

export function GraphPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const projectPath = searchParams.get("file") ?? searchParams.get("project");
    const decodedProjectPath = useMemo(() => (projectPath ? decodeURIComponent(projectPath) : null), [projectPath]);
    const { currentWorkspace } = useWorkspaceStore();
    const { loadProject, clearLoadedProject, projectConfig, setTransform, transform, persistProjectConfig, zoomIn, zoomOut, resetView } = useGraphStore();
    const transformRef = useRef(transform);
    useKeybindings();

    transformRef.current = transform;

    useEffect(() => {
        if (!currentWorkspace) {
            clearLoadedProject();
            navigate("/");
            return;
        }
        if (decodedProjectPath) {
            void loadProject(decodedProjectPath);
        } else {
            clearLoadedProject();
        }
    }, [clearLoadedProject, currentWorkspace, decodedProjectPath, loadProject, navigate]);

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
    }, [decodedProjectPath, persistProjectConfig]);

    // Flush any pending debounced saves when the page is hidden or unloaded,
    // so rapid drag-and-drop positions are never lost on refresh.
    useEffect(() => {
        const flush = () => { void flushPendingSave(); };
        document.addEventListener("visibilitychange", flush);
        window.addEventListener("beforeunload", flush);
        return () => {
            document.removeEventListener("visibilitychange", flush);
            window.removeEventListener("beforeunload", flush);
        };
    }, []);

    const zoomPercent = Math.round(transform.scale * 100);

    if (!decodedProjectPath) {
        return (
            <div className="editor-canvas__empty">
                <div className="editor-canvas__empty-title">{t("editor.noProjectSelected")}</div>
                <div className="editor-canvas__empty-copy">{t("editor.noProjectSelectedDesc")}</div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full overflow-hidden">
            <GraphCanvas />
            <EditContentDialog />

            <div className="canvas-zoom-controls">
                <button className="canvas-zoom-controls__btn" onClick={zoomOut} title={t("graph.zoomOut")}>
                    <Minus className="size-3.5" />
                </button>
                <span className="canvas-zoom-controls__label">{zoomPercent}%</span>
                <button className="canvas-zoom-controls__btn" onClick={zoomIn} title={t("graph.zoomIn")}>
                    <Plus className="size-3.5" />
                </button>
                <span className="canvas-zoom-controls__divider" />
                <button className="canvas-zoom-controls__btn" onClick={resetView} title={t("graph.resetView")}>
                    <RotateCcw className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
