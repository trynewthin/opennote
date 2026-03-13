import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getNodeTypeOptions } from "@/lib/nodeDisplay";
import { getNodeType } from "@/lib/nodeTypeRegistry";
import { useGraphStore } from "@/stores/graphStore";

import "./EditContentDialog.css";

export function EditContentDialog() {
    const { editNodeDialog, closeEditNodeDialog, updateNode, nodes } = useGraphStore();
    const node = nodes.find((item) => item.id === editNodeDialog.nodeId);

    const [nodeType, setNodeType] = useState("topic");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (editNodeDialog.open && node) {
            setNodeType(node.type);
            setContent(node.content);
        }
    }, [editNodeDialog.open, node]);

    const handleSubmit = async () => {
        if (!node) return;
        setSubmitting(true);
        try {
            await updateNode(node.id, nodeType, content);
            closeEditNodeDialog();
        } catch (error) {
            console.error("Failed to update node:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!editNodeDialog.open) return null;

    const { t } = useTranslation();
    const descriptor = getNodeType(nodeType);
    const nodeTypeOptions = getNodeTypeOptions();

    return (
        <div className="edit-content-overlay" onClick={handleSubmit}>
            <div className="edit-content-dialog" onClick={(event) => event.stopPropagation()}>
                <header className="edit-content-dialog__header">
                    <h2 className="edit-content-dialog__title">{t("graphNode.editNode")}</h2>
                    <div className="edit-content-dialog__actions">
                        <button
                            className="edit-content-dialog__btn edit-content-dialog__btn--cancel"
                            onClick={closeEditNodeDialog}
                            disabled={submitting}
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            className="edit-content-dialog__btn edit-content-dialog__btn--save"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? t("common.saving") : t("common.save")}
                        </button>
                    </div>
                </header>

                <div className="edit-content-dialog__body gap-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">{t("graphNode.nodeType")}</label>
                        <select
                            className="edit-content-dialog__input"
                            value={nodeType}
                            onChange={(event) => setNodeType(event.target.value)}
                        >
                            {nodeTypeOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {t(item.label)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {descriptor.editMode === "textarea" ? (
                        <textarea
                            className="edit-content-dialog__textarea"
                            placeholder={descriptor.contentPlaceholder}
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            autoFocus
                        />
                    ) : (
                        <input
                            className="edit-content-dialog__input"
                            placeholder={descriptor.contentPlaceholder}
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            autoFocus
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
