import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/projectStore";
import { useThemeStore } from "@/stores/themeStore";
import { ProjectCard, ProjectFormDialog } from "@/components/project";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Plus, FolderOpen, Menu, Settings, Sun, Moon, Upload } from "lucide-react";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { ImportExportDialog } from "@/components/project/ImportExportDialog";
import type { Project } from "@/types";

export function ProjectsPage() {
    const { projects, noteCounts, loading, error, fetchProjects } = useProjectStore();
    const [createOpen, setCreateOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleOpenProject = (project: Project) => {
        navigate(`/project/${project.id}`);
    };

    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-background">
            <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 select-none text-[clamp(8rem,20vw,16rem)] font-black leading-none tracking-tighter text-foreground/[0.03] -translate-x-2 translate-y-[0.1em]"
            >
                OpenNote
            </span>

            <main className="relative z-10 flex-1 overflow-y-auto">
                <div className="mx-auto max-w-6xl px-6 py-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-lg font-semibold">Projects</h1>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setImportOpen(true)}>
                                <Upload className="size-4" data-icon="inline-start" />
                                Import
                            </Button>
                            <Button onClick={() => setCreateOpen(true)}>
                                <Plus className="size-4" data-icon="inline-start" />
                                New Project
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                                    <Menu className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={4}>
                                    <DropdownMenuItem onClick={toggleTheme}>
                                        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                                        <Settings className="size-4" />
                                        Settings
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            Failed to load projects: {error}
                        </div>
                    )}

                    {loading && projects.length === 0 && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, index) => (
                                <div
                                    key={index}
                                    className="h-[140px] animate-pulse rounded-xl bg-muted/50 ring-1 ring-foreground/5"
                                />
                            ))}
                        </div>
                    )}

                    {!loading && projects.length === 0 && !error && (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="empty-state-icon mb-6 flex size-16 items-center justify-center rounded-2xl bg-muted">
                                <FolderOpen className="size-8 text-muted-foreground" />
                            </div>
                            <h2 className="mb-2 text-lg font-medium">No projects yet</h2>
                            <p className="mb-6 max-w-xs text-center text-sm text-muted-foreground">
                                Create your first knowledge graph project and start organizing your notes.
                            </p>
                            <Button onClick={() => setCreateOpen(true)} size="lg">
                                <Plus className="size-4" data-icon="inline-start" />
                                Create First Project
                            </Button>
                        </div>
                    )}

                    {projects.length > 0 && (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-medium text-muted-foreground">
                                    {projects.length} projects
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        noteCount={noteCounts[project.id] ?? 0}
                                        onOpen={handleOpenProject}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            <ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} />
            {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
            {importOpen && (
                <ImportExportDialog
                    mode="import"
                    onImported={() => fetchProjects()}
                    onClose={() => setImportOpen(false)}
                />
            )}
        </div>
    );
}
