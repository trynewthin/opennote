import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { exportProjectOn, importProjectOn } from "@/services/importExport";
import type { Project } from "@/types";
import "./ImportExportDialog.css";

type Mode = "export" | "import";

interface ImportExportDialogProps {
    mode: Mode;
    project?: Project;
    onImported?: () => void;
    onClose: () => void;
}

export function ImportExportDialog({ mode, project, onImported, onClose }: ImportExportDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        if (!project) return;
        setLoading(true);
        setError(null);
        try {
            const ok = await exportProjectOn(project.id, project.name);
            if (ok) onClose();
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        setLoading(true);
        setError(null);
        try {
            const id = await importProjectOn();
            if (id) {
                onImported?.();
                onClose();
            }
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ie-overlay" onClick={onClose}>
            <div className="ie-dialog" onClick={(e) => e.stopPropagation()}>
                <header className="ie-dialog__header">
                    <div className="ie-dialog__header-left">
                        {mode === "export" ? (
                            <Download className="ie-dialog__header-icon" />
                        ) : (
                            <Upload className="ie-dialog__header-icon" />
                        )}
                        <h2 className="ie-dialog__title">
                            {mode === "export" ? "导出项目" : "导入项目"}
                        </h2>
                    </div>
                    <button className="ie-dialog__close" onClick={onClose}>✕</button>
                </header>

                <div className="ie-dialog__body">
                    {mode === "export" && project && (
                        <div className="ie-dialog__info">
                            <span className="ie-dialog__info-label">项目</span>
                            <span className="ie-dialog__info-value">{project.name}</span>
                        </div>
                    )}

                    <div className="ie-dialog__desc">
                        {mode === "export"
                            ? "导出为 .on 格式文件，包含项目的所有节点、内容、连线和配置信息。"
                            : "选择一个 .on 格式文件导入为新项目。"
                        }
                    </div>

                    {error && <div className="ie-dialog__error">{error}</div>}
                </div>

                <footer className="ie-dialog__footer">
                    <button className="ie-dialog__btn ie-dialog__btn--cancel" onClick={onClose}>
                        取消
                    </button>
                    <button
                        className="ie-dialog__btn ie-dialog__btn--primary"
                        onClick={mode === "export" ? handleExport : handleImport}
                        disabled={loading}
                    >
                        {loading ? "处理中…" : mode === "export" ? "选择位置并导出" : "选择文件并导入"}
                    </button>
                </footer>
            </div>
        </div>
    );
}
