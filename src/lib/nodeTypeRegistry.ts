import type { NodeTheme } from "@/services/themeLoader";

/** Node type rendering variant — determines how GraphNode renders this type */
export type RenderVariant = "text" | "card" | "media-preview";

/** Edit mode — determines which editor is shown in EditContentDialog */
export type EditMode = "inline" | "textarea" | "path-input";

/** Category — used for filtering and grouping */
export type NodeCategory = "knowledge" | "resource" | "media";

export interface NodeTypeDescriptor {
    type: string;
    label: string;
    icon: string; // lucide icon name
    category: NodeCategory;
    renderVariant: RenderVariant;
    defaultThemeOverrides: Partial<NodeTheme>;
    contentPlaceholder: string;
    editMode: EditMode;
}

// ─── Built-in Node Types ───

const builtinTypes: NodeTypeDescriptor[] = [
    {
        type: "topic",
        label: "nodeTypes.topic",
        icon: "Lightbulb",
        category: "knowledge",
        renderVariant: "text",
        defaultThemeOverrides: {},
        contentPlaceholder: "Enter topic",
        editMode: "inline",
    },
    {
        type: "document",
        label: "nodeTypes.document",
        icon: "StickyNote",
        category: "knowledge",
        renderVariant: "card",
        defaultThemeOverrides: {
            fontSize: 13,
            fontWeight: 400,
        },
        contentPlaceholder: "Enter document content",
        editMode: "textarea",
    },
    {
        type: "file",
        label: "nodeTypes.file",
        icon: "File",
        category: "resource",
        renderVariant: "card",
        defaultThemeOverrides: {
            bgColor: "#eff6ff",
            bgColorDark: "#172554",
            borderColor: "#bfdbfe",
            borderColorDark: "#1e3a5f",
        },
        contentPlaceholder: "Enter file path",
        editMode: "path-input",
    },
    {
        type: "url",
        label: "nodeTypes.url",
        icon: "Link",
        category: "resource",
        renderVariant: "card",
        defaultThemeOverrides: {
            bgColor: "#ecfdf5",
            bgColorDark: "#022c22",
            borderColor: "#a7f3d0",
            borderColorDark: "#065f46",
        },
        contentPlaceholder: "Enter URL",
        editMode: "path-input",
    },
];

// ─── Registry ───

const registry = new Map<string, NodeTypeDescriptor>(builtinTypes.map((d) => [d.type, d]));

export function registerNodeType(descriptor: NodeTypeDescriptor) {
    registry.set(descriptor.type, descriptor);
}

export function getNodeType(type: string): NodeTypeDescriptor {
    return registry.get(type) ?? registry.get("topic")!;
}

export function getAllNodeTypes(): NodeTypeDescriptor[] {
    return [...registry.values()];
}

export function isResourceNodeType(type: string): boolean {
    const d = registry.get(type);
    return d?.category === "resource" || d?.category === "media";
}
