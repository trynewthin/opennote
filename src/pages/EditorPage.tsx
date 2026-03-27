import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EditorLayout } from "@/components/editor/EditorLayout";
import type { TabItem } from "@/components/editor/EditorLayout";
import { GraphPage } from "./GraphPage";
import { FilePreviewPage } from "./FilePreviewPage";
import { useWorkspaceStore } from "@/stores/workspaceStore";

function isProjectFile(path: string) {
    return path.endsWith(".on");
}

export function EditorPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Support both ?file= (universal) and ?project= (legacy) query params
    const rawFile = searchParams.get("file");
    const rawProject = searchParams.get("project");
    const currentFilePath = useMemo(() => {
        const raw = rawFile ?? rawProject;
        return raw ? decodeURIComponent(raw) : null;
    }, [rawFile, rawProject]);

    const { currentWorkspace, projects, loading, refreshProjects } = useWorkspaceStore();
    const [openTabs, setOpenTabs] = useState<string[]>([]);

    useEffect(() => {
        if (!currentWorkspace) {
            navigate("/");
            return;
        }
        void refreshProjects();
    }, [currentWorkspace, navigate, refreshProjects]);

    // Remove tabs for deleted .on projects (non-project files stay)
    useEffect(() => {
        const projectPaths = new Set(projects.map((p) => p.path));
        setOpenTabs((prev) =>
            prev.filter((path) => !isProjectFile(path) || projectPaths.has(path)),
        );
    }, [projects]);

    // If current file was a project and got deleted, navigate away
    useEffect(() => {
        if (!currentWorkspace || loading || !currentFilePath) return;
        if (isProjectFile(currentFilePath)) {
            const exists = projects.some((p) => p.path === currentFilePath);
            if (!exists) {
                const fallback = openTabs.find(
                    (path) => path !== currentFilePath && (!isProjectFile(path) || projects.some((p) => p.path === path)),
                );
                if (fallback) {
                    navigate(`/editor?file=${encodeURIComponent(fallback)}`, { replace: true });
                } else {
                    navigate("/editor", { replace: true });
                }
            }
        }
    }, [currentFilePath, currentWorkspace, loading, navigate, openTabs, projects]);

    // Keep openTabs in sync: add current file if not present
    useEffect(() => {
        if (!currentFilePath) return;
        setOpenTabs((prev) => (prev.includes(currentFilePath) ? prev : [...prev, currentFilePath]));
    }, [currentFilePath]);

    const getTabName = useCallback(
        (path: string) => {
            if (isProjectFile(path)) {
                const project = projects.find((p) => p.path === path);
                if (project?.name) return project.name;
            }
            return path.split(/[\\/]/).at(-1) ?? "Untitled";
        },
        [projects],
    );

    const tabs: TabItem[] = useMemo(
        () => openTabs.map((path) => ({ path, label: getTabName(path) })),
        [openTabs, getTabName],
    );

    const switchTab = useCallback(
        (path: string) => {
            navigate(`/editor?file=${encodeURIComponent(path)}`, { replace: true });
        },
        [navigate],
    );

    const closeTab = useCallback(
        (path: string) => {
            setOpenTabs((prev) => {
                const next = prev.filter((tab) => tab !== path);
                if (path === currentFilePath) {
                    if (next.length > 0) {
                        navigate(`/editor?file=${encodeURIComponent(next[next.length - 1])}`, { replace: true });
                    } else {
                        navigate("/editor", { replace: true });
                    }
                }
                return next;
            });
        },
        [currentFilePath, navigate],
    );

    if (!currentWorkspace) {
        return null;
    }

    const renderContent = () => {
        if (openTabs.length === 0 || !currentFilePath) {
            if (projects.length === 0 && !loading) {
                return (
                    <div className="editor-canvas__empty">
                        <div className="editor-canvas__empty-title">{t("editor.emptyWorkspace")}</div>
                        <div className="editor-canvas__empty-copy">{t("editor.emptyWorkspaceDesc")}</div>
                    </div>
                );
            }
            return (
                <div className="editor-canvas__empty">
                    <div className="editor-canvas__empty-title">{t("editor.noProjectSelected")}</div>
                    <div className="editor-canvas__empty-copy">{t("editor.noProjectSelectedDesc")}</div>
                </div>
            );
        }

        if (isProjectFile(currentFilePath)) {
            return <GraphPage />;
        }

        return <FilePreviewPage filePath={currentFilePath} />;
    };

    return (
        <EditorLayout
            currentProjectPath={currentFilePath}
            tabs={tabs}
            onTabSwitch={switchTab}
            onTabClose={closeTab}
        >
            {renderContent()}
        </EditorLayout>
    );
}
