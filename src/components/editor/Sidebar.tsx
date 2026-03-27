import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    FolderOpen,
    FolderPlus,
    Moon,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Pencil,
    Plus,
    RefreshCw,
    Settings,
    Sun,
    Trash2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tree, File, Folder, type TreeViewElement } from "@/components/ui/file-tree";
import { DeleteProjectDialog, ProjectFormDialog } from "@/components/project";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useThemeStore } from "@/stores/themeStore";
import { workspaceApi } from "@/services/workspaceApi";
import type { ProjectSummary, WorkspaceFileEntry } from "@/types";
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

/** Convert backend WorkspaceFileEntry tree to SidebarTreeElement[], attaching project data for .on files */
function convertTree(entries: WorkspaceFileEntry[], projectsByPath: Map<string, ProjectSummary>): SidebarTreeElement[] {
    return entries.map((entry) => {
        const normalizedPath = entry.path.replace(/\\/g, "/");
        const project = projectsByPath.get(normalizedPath);
        return {
            id: entry.path,
            name: project?.name ?? (entry.name.endsWith(".on") ? entry.name.replace(/\.on$/, "") : entry.name),
            path: entry.path,
            relativePath: entry.name,
            type: entry.kind === "directory" ? "folder" : "file",
            project,
            children: entry.kind === "directory" ? convertTree(entry.children, projectsByPath) : undefined,
        } satisfies SidebarTreeElement;
    });
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
    const { currentWorkspace, projects, fileTree, loading, refreshProjects } = useWorkspaceStore();
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

    const projectsByPath = useMemo(
        () => new Map(projects.map((p) => [p.path.replace(/\\/g, "/"), p])),
        [projects],
    );

    const treeElements = useMemo(
        () => convertTree(fileTree, projectsByPath),
        [fileTree, projectsByPath],
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

    const openFile = (filePath: string) => {
        navigate(`/editor?file=${encodeURIComponent(filePath)}`);
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

    const handleRename = async (item: SidebarTreeElement) => {
        const current = item.name;
        const newName = window.prompt(t("editor.rename"), current);
        if (!newName?.trim() || newName.trim() === current) return;
        try {
            await workspaceApi.renameFile(item.path, newName.trim());
            await refreshProjects();
        } catch (error) {
            console.error("Rename failed:", error);
            window.alert(String(error));
        }
    };

    const handleDeleteFile = async (item: SidebarTreeElement) => {
        const confirmed = window.confirm(t("editor.confirmDelete", { name: item.name }));
        if (!confirmed) return;
        try {
            await workspaceApi.deleteFile(item.path);
            await refreshProjects();
        } catch (error) {
            console.error("Delete failed:", error);
            window.alert(String(error));
        }
    };

    const menuProject = contextMenu?.item.project;

    return (
        <>
            <aside className={`editor-sidebar${collapsed ? " editor-sidebar--collapsed" : ""}`}>
                <div className="editor-sidebar__top">
                    {!collapsed && (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <button
                                    className="editor-sidebar__leave-btn"
                                    title={t("editor.menu")}
                                />
                            }
                        >
                            <Menu className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="bottom" sideOffset={6}>
                            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                                <Settings className="size-4 mr-2" />
                                {t("common.settings")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={toggleTheme}>
                                {theme === "dark" ? <Sun className="size-4 mr-2" /> : <Moon className="size-4 mr-2" />}
                                {theme === "dark" ? t("projects.lightMode") : t("projects.darkMode")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/")}>
                                <ArrowLeft className="size-4 mr-2" />
                                {t("workspace.switch")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                                    onFileSelect={openFile}
                                    onItemContextMenu={handleItemContextMenu}
                                />
                            </Tree>
                        )}
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
                                onClick={() => runMenuAction(() => void handleRename(contextMenu.item))}
                            >
                                <Pencil className="size-4" />
                                {t("editor.rename")}
                            </button>
                            <button
                                className="editor-sidebar__context-menu-item editor-sidebar__context-menu-item--danger"
                                onClick={() => runMenuAction(() => void handleDeleteFile(contextMenu.item))}
                            >
                                <Trash2 className="size-4" />
                                {t("common.delete")}
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
                                onClick={() => runMenuAction(() => openFile(menuProject.path))}
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
                    ) : (
                        <>
                            <button
                                className="editor-sidebar__context-menu-item"
                                onClick={() => runMenuAction(() => void handleRename(contextMenu.item))}
                            >
                                <Pencil className="size-4" />
                                {t("editor.rename")}
                            </button>
                            <button
                                className="editor-sidebar__context-menu-item editor-sidebar__context-menu-item--danger"
                                onClick={() => runMenuAction(() => void handleDeleteFile(contextMenu.item))}
                            >
                                <Trash2 className="size-4" />
                                {t("common.delete")}
                            </button>
                        </>
                    )}
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
                onSaved={(project) => navigate(`/editor?file=${encodeURIComponent(project.path)}`)}
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
                        navigate(`/editor?file=${encodeURIComponent(project.path)}`, { replace: true });
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
