import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    FolderOpen,
    FolderPlus,
    Moon,
    PanelLeftClose,
    PanelLeftOpen,
    Pencil,
    Plus,
    RefreshCw,
    Settings,
    Sun,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tree, File, Folder, type TreeViewElement } from "@/components/ui/file-tree";
import { DeleteProjectDialog, ProjectFormDialog } from "@/components/project";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useThemeStore } from "@/stores/themeStore";
import { workspaceApi } from "@/services/workspaceApi";
import type { ProjectSummary } from "@/types";
import "./sidebar.css";

interface SidebarTreeElement extends TreeViewElement {
    type: "folder" | "file";
    path: string;
    relativePath: string;
    project?: ProjectSummary;
    children?: SidebarTreeElement[];
}

interface SidebarContextMenuState {
    x: number;
    y: number;
    item: SidebarTreeElement;
}

function normalizeRelativePath(path: string) {
    return path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

/** Build nested SidebarTreeElement[] from flat projects + folder paths */
function buildTree(projects: ProjectSummary[], folders: string[], workspacePath: string | null): SidebarTreeElement[] {
    if (!workspacePath) return [];

    const normalizedWorkspace = workspacePath.replace(/\\/g, "/").replace(/\/$/, "");
    const root: SidebarTreeElement[] = [];
    const folderMap = new Map<string, SidebarTreeElement[]>();
    folderMap.set("", root);

    const ensureFolder = (segments: string[]): SidebarTreeElement[] => {
        let currentPath = "";
        let parent = root;

        for (const seg of segments) {
            currentPath = currentPath ? `${currentPath}/${seg}` : seg;
            if (!folderMap.has(currentPath)) {
                const folder: SidebarTreeElement = {
                    id: `${normalizedWorkspace}/${currentPath}`,
                    name: seg,
                    path: `${normalizedWorkspace}/${currentPath}`,
                    relativePath: currentPath,
                    type: "folder",
                    children: [],
                };
                parent.push(folder);
                folderMap.set(currentPath, folder.children ?? []);
            }
            parent = folderMap.get(currentPath) ?? root;
        }
        return parent;
    };

    for (const folderPath of folders) {
        const normalized = folderPath.replace(/\\/g, "/");
        const relative = normalized.startsWith(normalizedWorkspace + "/")
            ? normalized.slice(normalizedWorkspace.length + 1)
            : normalized;
        if (relative) {
            ensureFolder(relative.split("/"));
        }
    }

    for (const project of projects) {
        const normalizedPath = project.path.replace(/\\/g, "/");
        const relative = normalizedPath.startsWith(normalizedWorkspace + "/")
            ? normalizedPath.slice(normalizedWorkspace.length + 1)
            : normalizedPath;
        const parts = relative.split("/");
        const fileName = parts.pop() ?? project.name;
        const parentChildren = parts.length > 0 ? ensureFolder(parts) : root;

        parentChildren.push({
            id: project.path,
            name: project.name || fileName.replace(/\.on$/, ""),
            path: project.path,
            relativePath: relative,
            type: "file",
            project,
        });
    }

    return root;
}

function RenderTree({
    elements,
    onFileSelect,
    onItemContextMenu,
}: {
    elements: SidebarTreeElement[];
    onFileSelect: (path: string) => void;
    onItemContextMenu: (event: ReactMouseEvent<HTMLElement>, item: SidebarTreeElement) => void;
}) {
    return (
        <>
            {elements.map((el) =>
                el.type === "folder" ? (
                    <Folder
                        key={el.id}
                        value={el.id}
                        element={el.name}
                        triggerOnContextMenu={(event) => onItemContextMenu(event, el)}
                    >
                        {el.children && (
                            <RenderTree
                                elements={el.children}
                                onFileSelect={onFileSelect}
                                onItemContextMenu={onItemContextMenu}
                            />
                        )}
                    </Folder>
                ) : (
                    <File
                        key={el.id}
                        value={el.id}
                        handleSelect={() => onFileSelect(el.path)}
                        onContextMenu={(event) => onItemContextMenu(event, el)}
                    >
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
    const [createFolderPath, setCreateFolderPath] = useState<string | null>(null);
    const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null);
    const [deletingProject, setDeletingProject] = useState<ProjectSummary | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<SidebarContextMenuState | null>(null);
    const { theme, toggleTheme } = useThemeStore();

    const workspaceName = useMemo(
        () => currentWorkspace?.split(/[\\/]/).at(-1) ?? t("workspace.eyebrow"),
        [currentWorkspace, t],
    );

    const treeElements = useMemo(
        () => buildTree(projects, folders, currentWorkspace),
        [projects, folders, currentWorkspace],
    );

    useEffect(() => {
        if (!contextMenu) return;

        const closeMenu = () => setContextMenu(null);
        const handlePointerDown = (event: PointerEvent) => {
            if ((event.target as HTMLElement).closest(".editor-sidebar__context-menu")) return;
            closeMenu();
        };
        const handleContextMenu = (event: MouseEvent) => {
            if ((event.target as HTMLElement).closest(".editor-sidebar__context-menu")) {
                event.preventDefault();
                return;
            }
            closeMenu();
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeMenu();
        };

        document.addEventListener("pointerdown", handlePointerDown, true);
        document.addEventListener("contextmenu", handleContextMenu, true);
        document.addEventListener("keydown", handleKeyDown, true);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown, true);
            document.removeEventListener("contextmenu", handleContextMenu, true);
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [contextMenu]);

    const closeContextMenu = () => setContextMenu(null);

    const openProject = (projectPath: string) => {
        navigate(`/editor?project=${encodeURIComponent(projectPath)}`);
    };

    const openCreateProjectDialog = (folderPath?: string | null) => {
        setCreateFolderPath(folderPath ?? null);
        setCreateOpen(true);
    };

    const handleCreateFolder = async (baseRelativePath = "") => {
        const normalizedBase = normalizeRelativePath(baseRelativePath);
        const suggestedPath = normalizedBase ? `${normalizedBase}/` : "";
        const name = window.prompt(t("editor.newFolderName"), suggestedPath);
        if (!name?.trim()) return;
        const normalizedInput = normalizeRelativePath(name);
        const targetPath = normalizedBase
            ? normalizedInput === normalizedBase || normalizedInput.startsWith(`${normalizedBase}/`)
                ? normalizedInput
                : normalizeRelativePath(`${normalizedBase}/${normalizedInput}`)
            : normalizedInput;
        try {
            await workspaceApi.createWorkspaceFolder(targetPath);
            await refreshProjects();
        } catch (error) {
            console.error("Failed to create folder:", error);
        }
    };

    const handleItemContextMenu = (event: ReactMouseEvent<HTMLElement>, item: SidebarTreeElement) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            item,
        });
    };

    const runMenuAction = (action: () => void) => {
        closeContextMenu();
        action();
    };

    const menuProject = contextMenu?.item.project;

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
                                onClick={() => openCreateProjectDialog()}
                                title={t("projects.newProject")}
                            >
                                <Plus className="size-4" />
                            </button>
                            <button
                                className="editor-sidebar__leave-btn"
                                onClick={() => void handleCreateFolder()}
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
                        {treeElements.length === 0 ? (
                            <div className="editor-sidebar__empty">{t("editor.noProjects")}</div>
                        ) : (
                            <Tree
                                selectedId={currentProjectPath ?? undefined}
                                indicator={false}
                                className="editor-sidebar__file-tree"
                            >
                                <RenderTree
                                    elements={treeElements}
                                    onFileSelect={openProject}
                                    onItemContextMenu={handleItemContextMenu}
                                />
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

            {contextMenu && (
                <div
                    className="editor-sidebar__context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(event) => event.stopPropagation()}
                    onContextMenu={(event) => event.preventDefault()}
                >
                    {contextMenu.item.type === "folder" ? (
                        <>
                            <button
                                className="editor-sidebar__context-menu-item"
                                onClick={() =>
                                    runMenuAction(() => openCreateProjectDialog(contextMenu.item.relativePath))
                                }
                            >
                                <Plus className="size-4" />
                                {t("editor.newProjectHere")}
                            </button>
                            <button
                                className="editor-sidebar__context-menu-item"
                                onClick={() =>
                                    runMenuAction(() => {
                                        void handleCreateFolder(contextMenu.item.relativePath);
                                    })
                                }
                            >
                                <FolderPlus className="size-4" />
                                {t("editor.newSubfolder")}
                            </button>
                            <button
                                className="editor-sidebar__context-menu-item"
                                onClick={() =>
                                    runMenuAction(() => {
                                        void refreshProjects();
                                    })
                                }
                            >
                                <RefreshCw className="size-4" />
                                {t("editor.refresh")}
                            </button>
                        </>
                    ) : menuProject ? (
                        <>
                            <button
                                className="editor-sidebar__context-menu-item"
                                onClick={() => runMenuAction(() => openProject(menuProject.path))}
                            >
                                <FolderOpen className="size-4" />
                                {t("common.open")}
                            </button>
                            <button
                                className="editor-sidebar__context-menu-item"
                                onClick={() => runMenuAction(() => setEditingProject(menuProject))}
                            >
                                <Pencil className="size-4" />
                                {t("common.edit")}
                            </button>
                            <button
                                className="editor-sidebar__context-menu-item editor-sidebar__context-menu-item--danger"
                                onClick={() => runMenuAction(() => setDeletingProject(menuProject))}
                            >
                                <Trash2 className="size-4" />
                                {t("common.delete")}
                            </button>
                        </>
                    ) : null}
                </div>
            )}

            <ProjectFormDialog
                open={createOpen}
                onOpenChange={(open) => {
                    setCreateOpen(open);
                    if (!open) {
                        setCreateFolderPath(null);
                    }
                }}
                folderPath={createFolderPath}
                onSaved={(project) => navigate(`/editor?project=${encodeURIComponent(project.path)}`)}
            />
            <ProjectFormDialog
                open={!!editingProject}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingProject(null);
                    }
                }}
                project={editingProject ?? undefined}
                onSaved={(project) => {
                    if (editingProject?.path === currentProjectPath) {
                        navigate(`/editor?project=${encodeURIComponent(project.path)}`, { replace: true });
                    }
                }}
            />
            {deletingProject && (
                <DeleteProjectDialog
                    open={!!deletingProject}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeletingProject(null);
                        }
                    }}
                    project={deletingProject}
                />
            )}
            {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
        </>
    );
}
