import { useState, useEffect } from "react";
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface ProjectFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: Project;
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { addProject, editProject } = useProjectStore();
    const isEdit = !!project;

    useEffect(() => {
        if (open) {
            setName(project?.name ?? "");
            setDescription(project?.description ?? "");
        }
    }, [open, project]);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSubmitting(true);
        try {
            if (isEdit && project) {
                await editProject(project.id, name.trim(), description.trim());
            } else {
                await addProject(name.trim(), description.trim());
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save project:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-md" onClick={(event) => event.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{isEdit ? "Edit Project" : "New Project"}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {isEdit
                            ? "Update the project name and description."
                            : "Create a new knowledge graph project."}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid gap-3 py-2">
                    <div className="grid gap-1.5">
                        <label htmlFor="project-name" className="text-sm font-medium">
                            Project Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="project-name"
                            placeholder="Enter project name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") handleSubmit();
                            }}
                            autoFocus
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label htmlFor="project-desc" className="text-sm font-medium">
                            Description
                        </label>
                        <Input
                            id="project-desc"
                            placeholder="Optional short description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") handleSubmit();
                            }}
                        />
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit} disabled={!name.trim() || submitting}>
                        {submitting ? "Saving" : isEdit ? "Save" : "Create"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
