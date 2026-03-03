import { useEffect, useState } from "react";
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
import { Plus, FolderOpen, Settings, Sun, Moon } from "lucide-react";
import type { Project } from "@/types";

export function ProjectsPage() {
    const { projects, noteCounts, loading, error, fetchProjects } =
        useProjectStore();
    const [createOpen, setCreateOpen] = useState(false);
    const { theme, toggleTheme } = useThemeStore();

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleOpenProject = (project: Project) => {
        // TODO: 导航到图谱页面
        console.log("打开项目:", project.id, project.name);
    };

    return (
        <div className="relative h-screen bg-background overflow-hidden flex flex-col">
            {/* 背景大字 */}
            <span
                aria-hidden="true"
                className="pointer-events-none select-none absolute bottom-0 left-0 text-[clamp(8rem,20vw,16rem)] font-black leading-none tracking-tighter text-foreground/[0.03] -translate-x-2 translate-y-[0.1em]"
            >
                OPenNote
            </span>

            {/* 内容区域 — 内部滚动 */}
            <main className="relative z-10 flex-1 overflow-y-auto">
                <div className="mx-auto max-w-6xl px-6 py-6">
                    {/* 标题栏 */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-lg font-semibold">项目管理</h1>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setCreateOpen(true)}>
                                <Plus className="size-4" data-icon="inline-start" />
                                新建项目
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button variant="outline" size="icon" />
                                    }
                                >
                                    <Settings className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={4}>
                                    <DropdownMenuItem onClick={toggleTheme}>
                                        {theme === "dark" ? (
                                            <Sun className="size-4" />
                                        ) : (
                                            <Moon className="size-4" />
                                        )}
                                        {theme === "dark" ? "浅色模式" : "深色模式"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    {error && (
                        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            加载失败：{error}
                        </div>
                    )}

                    {/* 加载状态 */}
                    {loading && projects.length === 0 && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-[140px] animate-pulse rounded-xl bg-muted/50 ring-1 ring-foreground/5"
                                />
                            ))}
                        </div>
                    )}

                    {/* 空状态 */}
                    {!loading && projects.length === 0 && !error && (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-6 empty-state-icon">
                                <FolderOpen className="size-8 text-muted-foreground" />
                            </div>
                            <h2 className="text-lg font-medium mb-2">还没有项目</h2>
                            <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
                                创建你的第一个知识图谱项目，开始组织和关联你的笔记。
                            </p>
                            <Button onClick={() => setCreateOpen(true)} size="lg">
                                <Plus className="size-4" data-icon="inline-start" />
                                创建第一个项目
                            </Button>
                        </div>
                    )}

                    {/* 项目网格 */}
                    {projects.length > 0 && (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-medium text-muted-foreground">
                                    共 {projects.length} 个项目
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

            {/* 新建弹窗 */}
            <ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}
