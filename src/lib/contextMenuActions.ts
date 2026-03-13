import type { MenuContext } from "./contextMenuRegistry";
import { useGraphStore } from "@/stores/graphStore";

export function executeMenuAction(actionId: string, context: MenuContext) {
    const store = useGraphStore.getState();

    if (actionId === "createTopic") {
        void store.createNode("New topic", "topic");
        return;
    }
    if (actionId === "createFile") {
        void (async () => {
            const { open } = await import("@tauri-apps/plugin-dialog");
            const selected = await open({
                multiple: true,
                title: "Select files to add as nodes",
            });
            if (!selected) return;
            const paths = Array.isArray(selected) ? selected : [selected];
            await store.createFileNodes(paths);
        })();
        return;
    }

    if (actionId === "quickEdit" && context.targetId) {
        store.startEditNode(context.targetId);
        return;
    }
    if (actionId === "openEditDialog" && context.targetId) {
        store.openEditNodeDialog(context.targetId);
        return;
    }
    if (actionId === "startLink" && context.targetId) {
        window.dispatchEvent(new CustomEvent("graph:startLink", { detail: { nodeId: context.targetId } }));
        return;
    }
    if (actionId === "deleteNode" && context.targetId) {
        void store.deleteNode(context.targetId);
        return;
    }

    if (actionId.startsWith("setRelationDirection.") && context.relation) {
        const direction = actionId.split(".")[1] as "none" | "forward" | "backward";
        void store.updateRelation(context.relation.id, context.relation.content, direction);
        return;
    }
    if (actionId === "deleteRelation" && context.targetId) {
        void store.deleteRelation(context.targetId);
        return;
    }

    if (actionId === "deleteSelected") {
        const { selection } = store;
        if (selection.type === "node" && selection.id) {
            void store.deleteNode(selection.id);
        } else if (selection.type === "relation" && selection.id) {
            void store.deleteRelation(selection.id);
        }
        return;
    }
    if (actionId === "quickEditSelected") {
        const { selection } = store;
        if (selection.type === "node" && selection.id) {
            store.startEditNode(selection.id);
        }
        return;
    }
    if (actionId === "openEditDialogSelected") {
        const { selection } = store;
        if (selection.type === "node" && selection.id) {
            store.openEditNodeDialog(selection.id);
        }
        return;
    }
    if (actionId === "clearSelection") {
        store.setSelection({ type: null, id: null });
        return;
    }

    if (actionId === "zoomIn") { store.zoomIn(); return; }
    if (actionId === "zoomOut") { store.zoomOut(); return; }
    if (actionId === "resetView") { store.resetView(); return; }

    if (actionId === "__noop") return;
    console.warn(`Unknown menu action: ${actionId}`);
}
