import { useEffect } from "react";
import { useGraphStore } from "@/stores/graphStore";
import { resolveKeybinding } from "@/lib/keybindingRegistry";
import { executeMenuAction } from "@/lib/contextMenuActions";
import type { KeyBindingContext } from "@/lib/keybindingRegistry";
import type { MenuContext } from "@/lib/contextMenuRegistry";

/**
 * Graph-level keybinding hook.
 * Mount this in GraphPage to enable keyboard shortcuts.
 */
export function useKeybindings() {
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            // Skip when typing in an input/textarea
            const tag = (event.target as HTMLElement).tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

            const store = useGraphStore.getState();

            // Determine current context
            let context: KeyBindingContext = "graph";
            if (store.editNodeDialog.open) {
                context = "dialog.open";
            } else if (store.selection.type === "node" && store.selection.id) {
                context = "graph.nodeSelected";
            } else if (store.selection.type === "relation" && store.selection.id) {
                context = "graph.relationSelected";
            }

            const actionId = resolveKeybinding(event, context);
            if (!actionId) return;

            event.preventDefault();
            event.stopPropagation();

            // Build a minimal MenuContext for action dispatch
            const menuContext: MenuContext = {
                target: store.selection.type === "relation" ? "relation" : store.selection.type === "node" ? "node" : "canvas",
                zone: "background",
                targetId: store.selection.id ?? undefined,
                node: store.selection.type === "node" && store.selection.id
                    ? store.nodes.find((n) => n.id === store.selection.id) : undefined,
                relation: store.selection.type === "relation" && store.selection.id
                    ? store.relations.find((r) => r.id === store.selection.id) : undefined,
                worldX: 0,
                worldY: 0,
            };

            executeMenuAction(actionId, menuContext);
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);
}
