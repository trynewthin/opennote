/**
 * Declarative keybinding registry.
 * Action IDs align with contextMenuActions for shared dispatch.
 */

export type KeyBindingContext =
    | "graph"
    | "graph.nodeSelected"
    | "graph.relationSelected"
    | "dialog.open"
    | "global";

export interface KeyBinding {
    id: string;
    key: string; // normalized: "Ctrl+N", "Delete", "F2", "Ctrl+Shift+Z"
    label: string;
    when: KeyBindingContext;
    action: string;
}

// ─── Default Keybindings ───

export const defaultKeybindings: KeyBinding[] = [
    { id: "kb.delete", key: "Delete", label: "Delete selected", when: "graph.nodeSelected", action: "deleteSelected" },
    { id: "kb.backspace", key: "Backspace", label: "Delete selected", when: "graph.nodeSelected", action: "deleteSelected" },
    { id: "kb.deleteRel", key: "Delete", label: "Delete selected", when: "graph.relationSelected", action: "deleteSelected" },
    { id: "kb.backspaceRel", key: "Backspace", label: "Delete selected", when: "graph.relationSelected", action: "deleteSelected" },
    { id: "kb.f2", key: "F2", label: "Quick edit", when: "graph.nodeSelected", action: "quickEditSelected" },
    { id: "kb.ctrlE", key: "Ctrl+E", label: "Edit node dialog", when: "graph.nodeSelected", action: "openEditDialogSelected" },
    { id: "kb.escape", key: "Escape", label: "Clear selection", when: "graph", action: "clearSelection" },
    { id: "kb.zoomIn", key: "Ctrl+=", label: "Zoom in", when: "graph", action: "zoomIn" },
    { id: "kb.zoomIn2", key: "Ctrl++", label: "Zoom in", when: "graph", action: "zoomIn" },
    { id: "kb.zoomOut", key: "Ctrl+-", label: "Zoom out", when: "graph", action: "zoomOut" },
    { id: "kb.resetView", key: "Ctrl+0", label: "Reset view", when: "graph", action: "resetView" },
];

// ─── Key normalization ───

function normalizeKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) parts.push("Ctrl");
    if (event.shiftKey) parts.push("Shift");
    if (event.altKey) parts.push("Alt");

    let key = event.key;
    // Normalize common key names
    if (key === " ") key = "Space";
    if (key.length === 1) key = key.toUpperCase();

    // Avoid duplicating modifier keys
    if (!["Control", "Shift", "Alt", "Meta"].includes(key)) {
        parts.push(key);
    }

    return parts.join("+");
}

// ─── Context hierarchy ───
// More specific contexts include less specific ones
const contextHierarchy: Record<KeyBindingContext, KeyBindingContext[]> = {
    "graph.nodeSelected": ["graph.nodeSelected", "graph"],
    "graph.relationSelected": ["graph.relationSelected", "graph"],
    "graph": ["graph"],
    "dialog.open": ["dialog.open"],
    "global": ["global"],
};

// ─── Resolution ───

export function resolveKeybinding(
    event: KeyboardEvent,
    currentContext: KeyBindingContext,
): string | null {
    const normalized = normalizeKey(event);
    const validContexts = contextHierarchy[currentContext] ?? [currentContext];

    // Most specific match first (the hierarchy array is ordered specific → general)
    for (const ctx of validContexts) {
        for (const binding of defaultKeybindings) {
            if (binding.key === normalized && binding.when === ctx) {
                return binding.action;
            }
        }
    }
    return null;
}
