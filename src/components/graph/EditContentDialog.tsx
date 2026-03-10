import { useEffect, useState } from "react";
import { DEFAULT_NODE_TYPE_OPTIONS } from "@/lib/nodeDisplay";
import { useGraphStore } from "@/stores/graphStore";

import "./EditContentDialog.css";

export function EditContentDialog() {
    const { editNodeDialog, closeEditNodeDialog, updateNode, nodes } = useGraphStore();
    const node = nodes.find((item) => item.id === editNodeDialog.nodeId);

    const [nodeType, setNodeType] = useState("concept");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (editNodeDialog.open && node) {
            setNodeType(node.node_type);
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

    return (
        <div className="edit-content-overlay" onClick={handleSubmit}>
            <div className="edit-content-dialog" onClick={(event) => event.stopPropagation()}>
                <header className="edit-content-dialog__header">
                    <h2 className="edit-content-dialog__title">Edit Node</h2>
                    <div className="edit-content-dialog__actions">
                        <button
                            className="edit-content-dialog__btn edit-content-dialog__btn--cancel"
                            onClick={closeEditNodeDialog}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            className="edit-content-dialog__btn edit-content-dialog__btn--save"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? "Saving" : "Save"}
                        </button>
                    </div>
                </header>

                <div className="edit-content-dialog__body gap-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Node Type</label>
                        <select
                            className="edit-content-dialog__input"
                            value={nodeType}
                            onChange={(event) => setNodeType(event.target.value)}
                        >
                            {DEFAULT_NODE_TYPE_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {nodeType === "text" || nodeType === "note" || nodeType === "concept" ? (
                        <textarea
                            className="edit-content-dialog__textarea"
                            placeholder="Enter node content"
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            autoFocus
                        />
                    ) : (
                        <input
                            className="edit-content-dialog__input"
                            placeholder="Enter file path or URL"
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
