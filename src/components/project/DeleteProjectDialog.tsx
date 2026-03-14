import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProjectSummary } from "@/types";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useGraphStore } from "@/stores/graphStore";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
    AlertDialogMedia,
} from "@/components/ui/alert-dialog";
import { TriangleAlert } from "lucide-react";

interface DeleteProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: ProjectSummary;
}

function normalizeProjectPath(path: string | null) {
    return (path ?? "")
        .replace(/^\\\\\?\\/, "")
        .replace(/\//g, "\\")
        .toLowerCase();
}

export function DeleteProjectDialog({ open, onOpenChange, project }: DeleteProjectDialogProps) {
    const { t } = useTranslation();
    const [deleting, setDeleting] = useState(false);
    const { deleteProject } = useWorkspaceStore();
    const { projectPath: loadedProjectPath, suppressNextPersistForProject } = useGraphStore();
    const isDeletingLoadedProject = normalizeProjectPath(loadedProjectPath) === normalizeProjectPath(project.path);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            if (isDeletingLoadedProject) {
                suppressNextPersistForProject(project.path);
            }
            await deleteProject(project.path);
            onOpenChange(false);
        } catch (error) {
            if (isDeletingLoadedProject) {
                suppressNextPersistForProject(null);
            }
            console.error("Delete failed:", error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent size="sm" onClick={(event) => event.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive">
                        <TriangleAlert />
                    </AlertDialogMedia>
                    <AlertDialogTitle>{t("deleteProject.title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t("deleteProject.confirmMsg", { name: project.name })}{" "}
                        {t("deleteProject.noteWarning", { count: project.node_count })}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? t("deleteProject.deleting") : t("deleteProject.confirmDelete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
