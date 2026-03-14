import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    FolderPlus,
    Moon,
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
    RefreshCw,
    Settings,
    Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tree, File, Folder, type TreeViewElement } from "@/components/ui/file-tree";
import { ProjectFormDialog } from "@/components/project";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useThemeStore } from "@/stores/themeStore";
import { workspaceApi } from "@/services/workspaceApi";
import type { ProjectSummary } from "@/types";
import "./sidebar.css";

/** Build nested TreeViewElement[] from flat projects + folder paths */
function buildTree(projects: ProjectSummary[], folders: string[], workspacePath: string | null): TreeViewElement[] {
    if (!workspacePath) return [];

    const normalizedWorkspace = workspacePath.replace(/\\/g, "/").replace(/\/$/, "");
    const root: TreeViewElement[] = [];
    const folderMap = new Map<string, TreeViewElement[]>();
    folderMap.set("", root);

    const ensureFolder = (segments: string[]): TreeViewElement[] => {
        let currentPath = "";
        let parent = root;

        for (const seg of segments) {
            currentPath = currentPath ? `${currentPath}/${seg}` : seg;
            if (!folderMap.has(currentPath)) {
                const folder: TreeViewElement = {
                    id: `${normalizedWorkspace}/${currentPath}`,
                    name: seg,
                    type: "folder",
                    children: [],
                };
                parent.push(folder);
                folderMap.set(currentPath, folder.children!);
            }
            parent = folderMap.get(currentPath)!;
        }
        return parent;
    };

    // Pre-populate folders (including empty ones)
    for (const folderPath of folders) {
        const normalized = folderPath.replace(/\\/g, "/");
        const relative = normalized.startsWith(normalizedWorkspace + "/")
            ? normalized.slice(normalizedWorkspace.length + 1)
            : normalized;
        if (relative) {
            ensureFolder(relative.split("/"));
        }
    }

    // Add project files
    for (const project of projects) {
        const normalizedPath = project.path.replace(/\\/g, "/");
        const relative = normalizedPath.startsWith(normalizedWorkspace + "/")
            ? normalizedPath.slice(normalizedWorkspace.length + 1)
            : normalizedPath;
        const parts = relative.split("/");
        const fileName = parts.pop()!;
        const parentChildren = parts.length > 0 ? ensureFolder(parts) : root;

        parentChildren.push({
            id: project.path,
            name: project.name || fileName.replace(/\.on$/, ""),
            type: "file",
        });
    }

    return root;
}

/** Recursively render TreeViewElement[] with Folder/File components */
function RenderTree({ elements, onFileSelect }: { elements: TreeViewElement[]; onFileSelect: (id: string) => void }) {
    return (
        <>
            {elements.map((el) =>
                el.type === "folder" ? (
                    <Folder key={el.id} value={el.id} element={el.name}>
                        {el.children && <RenderTree elements={el.children} onFileSelect={onFileSelect} />}
                    </Folder>
                ) : (
                    <File key={el.id} value={el.id} handleSelect={onFileSelect}>
                        <span>{el.name}</span>
                    </File>
                ),
            )}
        </>
    );
}

interface SidebarProps {
    currentProjectPath: string | null;
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

export function Sidebar({ currentProjectPath, collapsed, onCollapse }: SidebarProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentWorkspace, projects, folders, loading, refreshProjects } = useWorkspaceStore();
    const [createOpen, setCreateOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { theme, toggleTheme } = useThemeStore();

    const workspaceName = useMemo(
        () => currentWorkspace?.split(/[\\/]/).at(-1) ?? t("workspace.eyebrow"),
        [currentWorkspace, t],
    );

    const treeElements: TreeViewElement[] = useMemo(
        () => buildTree(projects, folders, currentWorkspace),
        [projects, folders, currentWorkspace],
    );

    const openProject = (projectPath: string) => {
        navigate(`/editor?project=${encodeURIComponent(projectPath)}`);
    };

    const handleCreateFolder = async () => {
        const name = window.prompt(t("editor.newFolderName"));
        if (!name?.trim()) return;
        try {
            await workspaceApi.createWorkspaceFolder(name.trim());
            void refreshProjects();
        } catch (error) {
            console.error("Failed to create folder:", error);
        }
    };

    return (
        <>
            <aside className={`editor-sidebar${collapsed ? " editor-sidebar--collapsed" : ""}`}>
                <div className="editor-sidebar__top">
                    {!collapsed && (
                        <button
                            className="editor-sidebar__leave-btn"
                            onClick={() => navigate("/")}
                            title={t("workspace.switch")}
                        >
                            <ArrowLeft className="size-4" />
                        </button>
                    )}

                    {!collapsed && (
                        <span className="editor-sidebar__workspace-name" title={currentWorkspace ?? ""}>
                            {workspaceName}
                        </span>
                    )}

                    {!collapsed && (
                        <div className="editor-sidebar__top-actions">
                            <button
                                className="editor-sidebar__leave-btn"
                                onClick={() => setCreateOpen(true)}
                                title={t("projects.newProject")}
                            >
                                <Plus className="size-4" />
                            </button>
                            <button
                                className="editor-sidebar__leave-btn"
                                onClick={handleCreateFolder}
                                title={t("editor.newFolder")}
                            >
                                <FolderPlus className="size-4" />
                            </button>
                            <button
                                className="editor-sidebar__leave-btn"
                                onClick={() => void refreshProjects()}
                                disabled={loading}
                                title={t("editor.refresh")}
                            >
                                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    )}

                    <button
                        className="editor-sidebar__leave-btn"
                        onClick={() => onCollapse(!collapsed)}
                        title={collapsed ? t("editor.expandSidebar") : t("editor.collapseSidebar")}
                    >
                        {collapsed
                            ? <PanelLeftOpen className="size-4" />
                            : <PanelLeftClose className="size-4" />}
                    </button>
                </div>

                <div className="editor-sidebar__section">

                    <div className="editor-sidebar__tree">
                        {projects.length === 0 ? (
                            <div className="editor-sidebar__empty">{t("editor.noProjects")}</div>
                        ) : (
                            <Tree
                                selectedId={currentProjectPath ?? undefined}
                                indicator={false}
                                className="editor-sidebar__file-tree"
                            >
                                <RenderTree elements={treeElements} onFileSelect={openProject} />
                            </Tree>
                        )}
                    </div>
                </div>

                <div className="editor-sidebar__bottom">
                    <div className="editor-sidebar__action-grid">
                        <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                            <Settings className="size-4" data-icon="inline-start" />
                            {t("common.settings")}
                        </Button>
                        <Button variant="outline" onClick={toggleTheme}>
                            {theme === "dark" ? (
                                <Sun className="size-4" data-icon="inline-start" />
                            ) : (
                                <Moon className="size-4" data-icon="inline-start" />
                            )}
                            {theme === "dark" ? t("projects.lightMode") : t("projects.darkMode")}
                        </Button>
                    </div>
                </div>
            </aside>

            <ProjectFormDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSaved={(project) => navigate(`/editor?project=${encodeURIComponent(project.path)}`)}
            />
            {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
        </>
    );
}
