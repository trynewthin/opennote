import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EditorLayout } from "@/components/editor/EditorLayout";
import type { TabItem } from "@/components/editor/EditorLayout";
import { GraphPage } from "./GraphPage";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function EditorPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedProjectPath = searchParams.get("project");
    const currentProjectPath = useMemo(
        () => (requestedProjectPath ? decodeURIComponent(requestedProjectPath) : null),
        [requestedProjectPath],
    );
    const { currentWorkspace, projects, loading, refreshProjects } = useWorkspaceStore();
    const [openTabs, setOpenTabs] = useState<string[]>([]);

    useEffect(() => {
        if (!currentWorkspace) {
            navigate("/");
            return;
        }
        void refreshProjects();
    }, [currentWorkspace, navigate, refreshProjects]);

    // If current project was deleted/removed, navigate away
    useEffect(() => {
        const existing = new Set(projects.map((project) => project.path));
        setOpenTabs((prev) => prev.filter((path) => existing.has(path)));
    }, [projects]);

    useEffect(() => {
        if (!currentWorkspace || loading) return;
        if (!currentProjectPath) return;
        const exists = projects.some((project) => project.path === currentProjectPath);
        if (!exists) {
            const fallback = openTabs.find((path) => path !== currentProjectPath && projects.some((project) => project.path === path));
            if (fallback) {
                navigate(`/editor?project=${encodeURIComponent(fallback)}`, { replace: true });
            } else {
                navigate("/editor", { replace: true });
            }
        }
    }, [currentProjectPath, currentWorkspace, loading, navigate, openTabs, projects]);

    // Keep openTabs in sync: add current project if not present
    useEffect(() => {
        if (!currentProjectPath) return;
        setOpenTabs((prev) => (prev.includes(currentProjectPath) ? prev : [...prev, currentProjectPath]));
    }, [currentProjectPath]);

    const getTabName = useCallback(
        (path: string) => {
            const project = projects.find((p) => p.path === path);
            return project?.name ?? path.split(/[\\/]/).at(-1) ?? "Untitled";
        },
        [projects],
    );

    const tabs: TabItem[] = useMemo(
        () => openTabs.map((path) => ({ path, label: getTabName(path) })),
        [openTabs, getTabName],
    );

    const switchTab = useCallback(
        (path: string) => {
            navigate(`/editor?project=${encodeURIComponent(path)}`, { replace: true });
        },
        [navigate],
    );

    const closeTab = useCallback(
        (path: string) => {
            setOpenTabs((prev) => {
                const next = prev.filter((tab) => tab !== path);
                if (path === currentProjectPath) {
                    if (next.length > 0) {
                        navigate(`/editor?project=${encodeURIComponent(next[next.length - 1])}`, { replace: true });
                    } else {
                        navigate("/editor", { replace: true });
                    }
                }
                return next;
            });
        },
        [currentProjectPath, navigate],
    );

    if (!currentWorkspace) {
        return null;
    }

    return (
        <EditorLayout
            currentProjectPath={currentProjectPath}
            tabs={tabs}
            onTabSwitch={switchTab}
            onTabClose={closeTab}
        >
            {projects.length === 0 && !loading ? (
                <div className="editor-canvas__empty">
                    <div className="editor-canvas__empty-title">{t("editor.emptyWorkspace")}</div>
                    <div className="editor-canvas__empty-copy">{t("editor.emptyWorkspaceDesc")}</div>
                </div>
            ) : openTabs.length === 0 ? (
                <div className="editor-canvas__empty">
                    <div className="editor-canvas__empty-title">{t("editor.noProjectSelected")}</div>
                    <div className="editor-canvas__empty-copy">{t("editor.noProjectSelectedDesc")}</div>
                </div>
            ) : (
                <GraphPage />
            )}
        </EditorLayout>
    );
}
