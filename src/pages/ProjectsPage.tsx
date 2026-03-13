import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useThemeStore } from "@/stores/themeStore";
import { ProjectCard, ProjectFormDialog } from "@/components/project";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, FolderOpen, Menu, Settings, Sun, Moon, Plus } from "lucide-react";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import type { ProjectSummary } from "@/types";

export function ProjectsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentWorkspace, projects, loading, error, refreshProjects } = useWorkspaceStore();
    const [createOpen, setCreateOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { theme, toggleTheme } = useThemeStore();

    useEffect(() => {
        if (!currentWorkspace) {
            navigate("/");
            return;
        }
        void refreshProjects();
    }, [currentWorkspace, navigate, refreshProjects]);

    const handleOpenProject = (project: ProjectSummary) => {
        navigate(`/graph?project=${encodeURIComponent(project.path)}`);
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
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                                <FolderOpen className="size-4" />
                                <span>{currentWorkspace}</span>
                            </div>
                            <h1 className="text-lg font-semibold">{t("projects.title")}</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => navigate("/")}>
                                <ArrowLeft className="size-4" data-icon="inline-start" />
                                {t("workspace.switch")}
                            </Button>
                            <Button onClick={() => setCreateOpen(true)}>
                                <Plus className="size-4" data-icon="inline-start" />
                                {t("projects.newProject")}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                                    <Menu className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={4}>
                                    <DropdownMenuItem onClick={toggleTheme}>
                                        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                                        {theme === "dark" ? t("projects.lightMode") : t("projects.darkMode")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                                        <Settings className="size-4" />
                                        {t("common.settings")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            {t("projects.loadError", { error })}
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
                            <h2 className="mb-2 text-lg font-medium">{t("projects.noProjects")}</h2>
                            <p className="mb-6 max-w-xs text-center text-sm text-muted-foreground">
                                {t("projects.noProjectsDesc")}
                            </p>
                            <Button onClick={() => setCreateOpen(true)} size="lg">
                                <Plus className="size-4" data-icon="inline-start" />
                                {t("projects.createFirst")}
                            </Button>
                        </div>
                    )}

                    {projects.length > 0 && (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-medium text-muted-foreground">
                                    {t("projects.projectCount", { count: projects.length })}
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => (
                                    <ProjectCard
                                        key={project.path}
                                        project={project}
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
        </div>
    );
}
