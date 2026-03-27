import { useEffect, useState } from "react";
import { workspaceApi, type FileContent } from "@/services/workspaceApi";
import "@/styles/file-preview-page.css";

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
    )
        return "text";
    return "unknown";
}

interface FilePreviewPageProps {
    filePath: string;
}

export function FilePreviewPage({ filePath }: FilePreviewPageProps) {
    const [fileData, setFileData] = useState<FileContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        setFileData(null);
        workspaceApi
            .readFileByPath(filePath)
            .then(setFileData)
            .catch((err) => setError(String(err)))
            .finally(() => setLoading(false));
    }, [filePath]);

    const kind = classifyMime(fileData?.mime_type);
    const fileName = fileData?.file_name ?? filePath.split(/[\\/]/).at(-1) ?? "File";
    const dataSrc =
        fileData?.encoding === "base64" && fileData.mime_type
            ? `data:${fileData.mime_type};base64,${fileData.data}`
            : "";

    return (
        <div className="file-preview-page">
            <div className="file-preview-page__header">
                <span className="file-preview-page__title">{fileName}</span>
                {fileData?.mime_type && (
                    <span className="file-preview-page__mime">{fileData.mime_type}</span>
                )}
            </div>

            <div className="file-preview-page__body">
                {loading && <div className="file-preview-page__status">Loading…</div>}
                {error && <div className="file-preview-page__status file-preview-page__status--error">{error}</div>}

                {fileData && kind === "image" && (
                    <img className="file-preview-page__image" src={dataSrc} alt={fileName} />
                )}
                {fileData && kind === "video" && (
                    <video className="file-preview-page__video" src={dataSrc} controls />
                )}
                {fileData && kind === "audio" && (
                    <div className="file-preview-page__audio-wrapper">
                        <audio className="file-preview-page__audio" src={dataSrc} controls />
                    </div>
                )}
                {fileData && kind === "text" && (
                    <pre className="file-preview-page__code">
                        <code>
                            {fileData.data.length > 200_000
                                ? `${fileData.data.slice(0, 200_000)}\n\n... (truncated)`
                                : fileData.data}
                        </code>
                    </pre>
                )}
                {fileData && kind === "unknown" && (
                    <div className="file-preview-page__status">
                        <p>Cannot preview this file type</p>
                        <p className="file-preview-page__mime">{fileData.mime_type ?? "Unknown type"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
