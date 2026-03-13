import type { Node, Relation } from "@/types";

// ─── Types ───

export type MenuTarget = "canvas" | "node" | "relation";
export type MenuZone = "background" | "label" | "body" | "line";

export interface MenuContext {
    target: MenuTarget;
    zone: MenuZone;
    targetId?: string;
    node?: Node;
    relation?: Relation;
    worldX: number;
    worldY: number;
}

export interface MenuItemDef {
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    danger?: boolean;
    separator?: "before" | "after";
    target: MenuTarget;
    zone?: MenuZone; // undefined = all zones for that target
    nodeTypes?: string[]; // only show for these types (empty = all)
    action: string;
    hidden?: (ctx: MenuContext) => boolean;
}

// ─── Default Menu Items ───

export const defaultMenuItems: MenuItemDef[] = [
    // Canvas
    {
        id: "canvas.addNode",
        label: "contextMenu.addNode",
        icon: "Plus",
        target: "canvas",
        action: "createTopic",
    },
    {
        id: "canvas.addFile",
        label: "contextMenu.addFile",
        icon: "Plus",
        target: "canvas",
        action: "createFile",
    },

    // Node — general
    {
        id: "node.quickEdit",
        label: "contextMenu.quickEdit",
        icon: "Pencil",
        shortcut: "F2",
        target: "node",
        action: "quickEdit",
    },
    {
        id: "node.editDialog",
        label: "contextMenu.editNode",
        icon: "Settings2",
        shortcut: "Ctrl+E",
        target: "node",
        action: "openEditDialog",
    },
    {
        id: "node.startLink",
        label: "contextMenu.startLink",
        icon: "GitBranch",
        shortcut: "Shift+Click",
        target: "node",
        action: "startLink",
        separator: "before",
    },
    // --- custom slot ---
    {
        id: "node.__customSlot",
        label: "",
        target: "node",
        action: "__noop",
        separator: "before",
        hidden: () => true, // invisible placeholder
    },
    {
        id: "node.delete",
        label: "contextMenu.deleteNode",
        icon: "Trash2",
        shortcut: "Delete",
        danger: true,
        target: "node",
        action: "deleteNode",
        separator: "before",
    },

    // Relation — direction controls
    {
        id: "relation.dirNone",
        label: "contextMenu.noDirection",
        target: "relation",
        action: "setRelationDirection.none",
    },
    {
        id: "relation.dirForward",
        label: "contextMenu.forward",
        target: "relation",
        action: "setRelationDirection.forward",
    },
    {
        id: "relation.dirBackward",
        label: "contextMenu.backward",
        target: "relation",
        action: "setRelationDirection.backward",
    },
    {
        id: "relation.delete",
        label: "contextMenu.deleteRelation",
        icon: "Trash2",
        danger: true,
        target: "relation",
        action: "deleteRelation",
        separator: "before",
    },
];

// ─── Resolution ───

export function resolveMenuItems(context: MenuContext): MenuItemDef[] {
    return defaultMenuItems.filter((item) => {
        if (item.target !== context.target) return false;
        if (item.zone && item.zone !== context.zone) return false;
        if (item.nodeTypes && item.nodeTypes.length > 0 && context.node) {
            if (!item.nodeTypes.includes(context.node.type)) return false;
        }
        if (item.hidden?.(context)) return false;
        return true;
    });
}
