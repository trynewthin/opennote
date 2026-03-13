import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { workspaceApi } from "@/services/workspaceApi";
import { useGraphStore } from "@/stores/graphStore";
import "@/styles/file-preview.css";

interface FilePreviewDialogProps {
    nodeId: string;
    onClose: () => void;
}

type PreviewKind = "text" | "image" | "video" | "audio" | "unknown";

function classifyMime(mime: string | null | undefined): PreviewKind {
    if (!mime) return "unknown";
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    if (
        mime.startsWith("text/") ||
        mime === "application/json" ||
        mime === "application/javascript" ||
        mime === "application/xml" ||
        mime === "application/x-yaml" ||
        mime === "application/toml"
    ) return "text";
    return "unknown";
}

interface FileData {
    encoding: string;
    data: string;
    mime_type: string | null;
    file_name: string | null;
}

export function FilePreviewDialog({ nodeId, onClose }: FilePreviewDialogProps) {
    const projectPath = useGraphStore((state) => state.projectPath);
    const [fileData, setFileData] = useState<FileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!projectPath) return;
        setLoading(true);
        setError(null);
        setFileData(null);
        workspaceApi
            .readNodeFile(projectPath, nodeId)
            .then(setFileData)
            .catch((err) => setError(String(err)))
            .finally(() => setLoading(false));
    }, [nodeId, projectPath]);

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    const kind = classifyMime(fileData?.mime_type);
    const fileName = fileData?.file_name ?? "File";
    const dataSrc =
        fileData?.encoding === "base64" && fileData.mime_type
            ? `data:${fileData.mime_type};base64,${fileData.data}`
            : "";

    return (
        <div className="file-preview-overlay" onClick={onClose} onMouseDown={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}>
            <div
                className="file-preview-dialog"
                onClick={(event) => event.stopPropagation()}
                onWheel={(event) => event.stopPropagation()}
            >
                <div className="file-preview-dialog__header">
                    <span className="file-preview-dialog__title">{fileName}</span>
                    <button className="file-preview-dialog__close" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
                <div className="file-preview-dialog__body">
                    {loading && <div className="file-preview-dialog__loading">Loading...</div>}
                    {error && <div className="file-preview-dialog__error">{error}</div>}
                    {fileData && kind === "image" && (
                        <img className="file-preview-dialog__image" src={dataSrc} alt={fileName} />
                    )}
                    {fileData && kind === "video" && (
                        <video className="file-preview-dialog__video" src={dataSrc} controls />
                    )}
                    {fileData && kind === "audio" && (
                        <audio className="file-preview-dialog__audio" src={dataSrc} controls />
                    )}
                    {fileData && kind === "text" && (
                        <pre className="file-preview-dialog__code">
                            <code>{fileData.data.length > 100_000 ? `${fileData.data.slice(0, 100_000)}\n\n... (truncated)` : fileData.data}</code>
                        </pre>
                    )}
                    {fileData && kind === "unknown" && (
                        <div className="file-preview-dialog__unknown">
                            <p>Cannot preview this file type</p>
                            <p className="file-preview-dialog__mime">{fileData.mime_type ?? "Unknown type"}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
