import { useState } from "react";
import type { Project } from "@/types";
import { useProjectStore } from "@/stores/projectStore";
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
    project: Project;
    noteCount: number;
}

export function DeleteProjectDialog({
    open,
    onOpenChange,
    project,
    noteCount,
}: DeleteProjectDialogProps) {
    const [deleting, setDeleting] = useState(false);
    const { removeProject } = useProjectStore();

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await removeProject(project.id);
            onOpenChange(false);
        } catch (e) {
            console.error("删除失败:", e);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent
                size="sm"
                onClick={(e) => e.stopPropagation()}
            >
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive">
                        <TriangleAlert />
                    </AlertDialogMedia>
                    <AlertDialogTitle>删除项目</AlertDialogTitle>
                    <AlertDialogDescription>
                        确定要删除「<strong>{project.name}</strong>」吗？
                        {noteCount > 0 && (
                            <>
                                该项目包含{" "}
                                <strong className="text-destructive">{noteCount}</strong>{" "}
                                条笔记，删除后将无法恢复。
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? "删除中…" : "确认删除"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
