import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProjectSummary } from "@/types";
import { useWorkspaceStore } from "@/stores/workspaceStore";
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
    project?: ProjectSummary;
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { createProject, updateProject } = useWorkspaceStore();
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
                await updateProject(project.path, name.trim(), description.trim());
            } else {
                await createProject(name.trim(), description.trim());
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
                    <AlertDialogTitle>{isEdit ? t("projectForm.editTitle") : t("projectForm.createTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {isEdit ? t("projectForm.editDesc") : t("projectForm.createDesc")}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid gap-3 py-2">
                    <div className="grid gap-1.5">
                        <label htmlFor="project-name" className="text-sm font-medium">
                            {t("projectForm.nameLabel")} <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="project-name"
                            placeholder={t("projectForm.namePlaceholder")}
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
                            {t("projectForm.descLabel")}
                        </label>
                        <Input
                            id="project-desc"
                            placeholder={t("projectForm.descPlaceholder")}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") handleSubmit();
                            }}
                        />
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={submitting}>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit} disabled={!name.trim() || submitting}>
                        {submitting ? t("common.saving") : isEdit ? t("common.save") : t("common.create")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
