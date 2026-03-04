import { useState, useEffect } from "react";
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

const CONTENT_TYPES = [
    { value: "text", label: "文本", icon: "📝", desc: "Markdown / 纯文本" },
    { value: "image", label: "图片", icon: "🖼️", desc: "PNG / JPG / SVG 等" },
    { value: "audio", label: "音频", icon: "🎵", desc: "MP3 / WAV 等" },
    { value: "video", label: "视频", icon: "🎬", desc: "MP4 / WebM 等" },
    { value: "file", label: "文件", icon: "📎", desc: "任意文件附件" },
] as const;

type ContentTypeValue = (typeof CONTENT_TYPES)[number]["value"];

export function AddContentDialog() {
    const { addContentDialog, closeAddContentDialog, addContentToNode } = useGraphStore();

    const [contentType, setContentType] = useState<ContentTypeValue>("text");
    const [valueText, setValueText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (addContentDialog.open) {
            setContentType("text");
            setValueText("");
        }
    }, [addContentDialog.open]);

    const handleSubmit = async () => {
        const nodeId = addContentDialog.nodeId;
        if (!nodeId) return;

        setSubmitting(true);
        try {
            await addContentToNode(nodeId, contentType, valueText || null);
            closeAddContentDialog();
        } catch (e) {
            console.error("添加内容失败:", e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AlertDialog open={addContentDialog.open} onOpenChange={(open) => { if (!open) closeAddContentDialog(); }}>
            <AlertDialogContent
                className="sm:max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>添加内容</AlertDialogTitle>
                    <AlertDialogDescription>
                        选择内容类型，内容将关联到当前节点。
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid gap-4 py-2">
                    {/* Content type selector */}
                    <div className="grid gap-1.5">
                        <label className="text-sm font-medium">内容类型</label>
                        <div className="grid grid-cols-5 gap-1.5">
                            {CONTENT_TYPES.map((ct) => (
                                <button
                                    key={ct.value}
                                    type="button"
                                    className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors cursor-pointer
                                        ${contentType === ct.value
                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-600 dark:text-zinc-400"
                                        }`}
                                    onClick={() => setContentType(ct.value)}
                                >
                                    <span className="text-lg">{ct.icon}</span>
                                    <span className="font-medium">{ct.label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {CONTENT_TYPES.find((ct) => ct.value === contentType)?.desc}
                        </p>
                    </div>

                    {/* Text content */}
                    {contentType === "text" && (
                        <div className="grid gap-1.5">
                            <label htmlFor="content-value" className="text-sm font-medium">
                                内容
                            </label>
                            <textarea
                                id="content-value"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                placeholder="输入文本内容（支持 Markdown）…"
                                value={valueText}
                                onChange={(e) => setValueText(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}

                    {/* File path (for non-text types) */}
                    {contentType !== "text" && (
                        <div className="grid gap-1.5">
                            <label htmlFor="content-path" className="text-sm font-medium">
                                文件路径
                            </label>
                            <Input
                                id="content-path"
                                placeholder="文件路径（后续支持选择器）…"
                                value={valueText}
                                onChange={(e) => setValueText(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? "添加中…" : "添加"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
