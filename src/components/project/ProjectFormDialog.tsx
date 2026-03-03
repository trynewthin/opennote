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
    project?: Project; // 编辑模式传入
}

export function ProjectFormDialog({
    open,
    onOpenChange,
    project,
}: ProjectFormDialogProps) {
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
        } catch (e) {
            console.error("操作失败:", e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent
                className="sm:max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isEdit ? "编辑项目" : "新建项目"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isEdit
                            ? "修改项目名称和描述。"
                            : "创建一个新的知识图谱项目。"}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid gap-3 py-2">
                    <div className="grid gap-1.5">
                        <label
                            htmlFor="project-name"
                            className="text-sm font-medium"
                        >
                            项目名称 <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="project-name"
                            placeholder="输入项目名称…"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSubmit();
                            }}
                            autoFocus
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label
                            htmlFor="project-desc"
                            className="text-sm font-medium"
                        >
                            描述
                        </label>
                        <Input
                            id="project-desc"
                            placeholder="可选，简要描述项目内容…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSubmit();
                            }}
                        />
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleSubmit}
                        disabled={!name.trim() || submitting}
                    >
                        {submitting ? "保存中…" : isEdit ? "保存" : "创建"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
