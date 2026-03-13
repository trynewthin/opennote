import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProjectSummary } from "@/types";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
    CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, StickyNote, Clock } from "lucide-react";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { DeleteProjectDialog } from "./DeleteProjectDialog";

interface ProjectCardProps {
    project: ProjectSummary;
    onOpen?: (project: ProjectSummary) => void;
}

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
    const { t } = useTranslation();
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const timeAgo = formatRelativeTime(t, project.updated_at);

    return (
        <>
            <Card
                className="project-card group cursor-pointer border border-black/8 bg-card/60 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-black/12 dark:border-white/8 dark:bg-white/6 dark:hover:border-white/12"
                onClick={() => onOpen?.(project)}
            >
                <CardHeader>
                    <CardTitle className="truncate">{project.name}</CardTitle>
                    <CardAction>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        className="opacity-0 transition-opacity group-hover:opacity-100"
                                        onClick={(event) => event.stopPropagation()}
                                    />
                                }
                            >
                                <MoreHorizontal className="size-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                                <DropdownMenuItem
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setEditOpen(true);
                                    }}
                                >
                                    <Pencil />
                                    {t("common.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setDeleteOpen(true);
                                    }}
                                >
                                    <Trash2 />
                                    {t("common.delete")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardAction>
                    {project.description && <CardDescription className="line-clamp-2">{project.description}</CardDescription>}
                </CardHeader>

                <CardFooter className="gap-4 bg-black/[0.02] text-xs text-muted-foreground dark:bg-white/[0.03]">
                    <span className="inline-flex items-center gap-1">
                        <StickyNote className="size-3" />
                        {t("projects.noteCount", { count: project.node_count })}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {timeAgo}
                    </span>
                </CardFooter>
            </Card>

            <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
            <DeleteProjectDialog open={deleteOpen} onOpenChange={setDeleteOpen} project={project} />
        </>
    );
}

function formatRelativeTime(t: (key: string, opts?: Record<string, unknown>) => string, timestampMs: number): string {
    const now = Date.now();
    const diff = now - timestampMs;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return t("time.justNow");
    if (minutes < 60) return t("time.minutesAgo", { count: minutes });
    if (hours < 24) return t("time.hoursAgo", { count: hours });
    if (days < 30) return t("time.daysAgo", { count: days });

    const date = new Date(timestampMs);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
