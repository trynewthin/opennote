import { useEffect, useRef, useState, type KeyboardEvent } from "react";
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
    onSaved?: (project: ProjectSummary) => void;
    folderPath?: string | null;
}

export function ProjectFormDialog({ open, onOpenChange, project, onSaved, folderPath }: ProjectFormDialogProps) {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const submittingRef = useRef(false);
    const createRequestIdRef = useRef<string | null>(null);

    const { createProject, updateProject } = useWorkspaceStore();
    const isEdit = !!project;

    useEffect(() => {
        if (open) {
            setName(project?.name ?? "");
            setDescription(project?.description ?? "");
            setSubmitting(false);
            submittingRef.current = false;
            createRequestIdRef.current = project ? null : crypto.randomUUID();
        }
    }, [open, project]);

    const handleSubmit = async () => {
        if (!name.trim() || submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);
        try {
            if (isEdit && project) {
                const saved = await updateProject(project.path, name.trim(), description.trim());
                onSaved?.(saved);
            } else {
                const saved = await createProject(
                    name.trim(),
                    description.trim(),
                    folderPath,
                    createRequestIdRef.current,
                );
                onSaved?.(saved);
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save project:", error);
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    const handleEnterSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter" || event.repeat || event.nativeEvent.isComposing) return;
        event.preventDefault();
        void handleSubmit();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-md" onClick={(event) => event.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{isEdit ? t("projectForm.editTitle") : t("projectForm.createTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {isEdit
                            ? t("projectForm.editDesc")
                            : folderPath
                                ? t("projectForm.createInFolderDesc", { folder: folderPath })
                                : t("projectForm.createDesc")}
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
                            onKeyDown={handleEnterSubmit}
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
                            onKeyDown={handleEnterSubmit}
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
