import { useState, useEffect } from "react";
import { useGraphStore } from "@/stores/graphStore";

import "./EditContentDialog.css";

export function EditContentDialog() {
    const { editContentDialog, closeEditContentDialog, updateContent, contents } = useGraphStore();

    const content = contents.find((c) => c.id === editContentDialog.contentId);

    const [valueText, setValueText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (editContentDialog.open && content) {
            setValueText(content.value_text || "");
        }
    }, [editContentDialog.open, content?.id]);

    const handleSubmit = async () => {
        if (!content) return;
        setSubmitting(true);
        try {
            await updateContent(content.id, content.content_type, valueText || null);
            closeEditContentDialog();
        } catch (e) {
            console.error("编辑内容失败:", e);
        } finally {
            setSubmitting(false);
        }
    };

    if (!editContentDialog.open) return null;

    return (
        <div className="edit-content-overlay" onClick={handleSubmit}>
            <div className="edit-content-dialog" onClick={(e) => e.stopPropagation()}>
                {/* Header: title left, buttons right */}
                <header className="edit-content-dialog__header">
                    <h2 className="edit-content-dialog__title">编辑</h2>
                    <div className="edit-content-dialog__actions">
                        <button
                            className="edit-content-dialog__btn edit-content-dialog__btn--cancel"
                            onClick={closeEditContentDialog}
                            disabled={submitting}
                        >
                            取消
                        </button>
                        <button
                            className="edit-content-dialog__btn edit-content-dialog__btn--save"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? "保存中…" : "保存"}
                        </button>
                    </div>
                </header>

                {/* Content area */}
                <div className="edit-content-dialog__body">
                    {content?.content_type === "text" ? (
                        <textarea
                            className="edit-content-dialog__textarea"
                            placeholder="输入文本内容…"
                            value={valueText}
                            onChange={(e) => setValueText(e.target.value)}
                            autoFocus
                        />
                    ) : (
                        <input
                            className="edit-content-dialog__input"
                            placeholder="文件路径…"
                            value={valueText}
                            onChange={(e) => setValueText(e.target.value)}
                            autoFocus
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
