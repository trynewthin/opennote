import type { Node, NodeResourceMetadata } from "@/types";

export const DEFAULT_NODE_TYPE_OPTIONS = [
    { value: "concept", label: "Concept" },
    { value: "text", label: "Text" },
    { value: "note", label: "Note" },
    { value: "file", label: "File" },
    { value: "image", label: "Image" },
    { value: "url", label: "URL" },
] as const;

export const DEFAULT_RELATION_TYPE_OPTIONS = [
    { value: "related", label: "Related" },
    { value: "reference", label: "Reference" },
    { value: "depends_on", label: "Depends On" },
] as const;

const RESOURCE_NODE_TYPES = new Set(["file", "image", "url"]);

function takeFirstLine(value: string): string {
    return value.trim().split(/\r?\n/, 1)[0] ?? "";
}

function truncate(value: string, max = 48): string {
    return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function stripQueryAndHash(value: string): string {
    return value.split(/[?#]/, 1)[0] ?? value;
}

function fallbackResourceName(content: string): string | null {
    const normalized = stripQueryAndHash(content.trim()).replace(/[\\/]+$/, "");
    if (!normalized) return null;
    const pieces = normalized.split(/[\\/]/).filter(Boolean);
    return pieces.at(-1) ?? null;
}

export function isResourceNodeType(nodeType: string): boolean {
    return RESOURCE_NODE_TYPES.has(nodeType);
}

export function displayText(
    node: Pick<Node, "node_type" | "content">,
    metadata?: NodeResourceMetadata | null,
): string {
    const content = node.content.trim();
    if (isResourceNodeType(node.node_type)) {
        const resourceName = metadata?.display_name ?? fallbackResourceName(content);
        return truncate(resourceName || node.node_type);
    }
    if (content) {
        return truncate(takeFirstLine(content));
    }
    return node.node_type;
}
