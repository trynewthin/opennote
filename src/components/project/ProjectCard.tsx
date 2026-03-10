import { useState } from "react";
import type { Project } from "@/types";
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
import { MoreHorizontal, Pencil, Trash2, StickyNote, Clock, Download } from "lucide-react";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { ImportExportDialog } from "./ImportExportDialog";

interface ProjectCardProps {
    project: Project;
    noteCount: number;
    onOpen?: (project: Project) => void;
}

export function ProjectCard({ project, noteCount, onOpen }: ProjectCardProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    const timeAgo = formatRelativeTime(project.updated_at);

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
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setExportOpen(true);
                                    }}
                                >
                                    <Download />
                                    Export
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
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardAction>
                    {project.description && <CardDescription className="line-clamp-2">{project.description}</CardDescription>}
                </CardHeader>

                <CardFooter className="gap-4 bg-black/[0.02] text-xs text-muted-foreground dark:bg-white/[0.03]">
                    <span className="inline-flex items-center gap-1">
                        <StickyNote className="size-3" />
                        {noteCount} notes
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {timeAgo}
                    </span>
                </CardFooter>
            </Card>

            <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
            <DeleteProjectDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                project={project}
                noteCount={noteCount}
            />
            {exportOpen && (
                <ImportExportDialog
                    mode="export"
                    project={project}
                    onClose={() => setExportOpen(false)}
                />
            )}
        </>
    );
}

function formatRelativeTime(timestampMs: number): string {
    const now = Date.now();
    const diff = now - timestampMs;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;

    const date = new Date(timestampMs);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
