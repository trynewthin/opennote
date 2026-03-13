import type { Node, NodeResourceMetadata, NodeViewConfig } from "@/types";
import { getAllNodeTypes, getNodeType } from "./nodeTypeRegistry";
import { configService } from "@/services/configService";

export function getNodeTypeOptions() {
    return getAllNodeTypes().map((descriptor) => ({ value: descriptor.type, label: descriptor.label }));
}

export const DEFAULT_RELATION_TYPE_OPTIONS = [
    { value: "related", label: "Related" },
    { value: "reference", label: "Reference" },
    { value: "depends_on", label: "Depends On" },
] as const;

export function isResourceNodeType(nodeType: string): boolean {
    const descriptor = getNodeType(nodeType);
    return descriptor.category === "resource" || descriptor.category === "media";
}

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

export function displayText(
    node: Pick<Node, "type" | "content" | "view_config">,
    metadata?: NodeResourceMetadata | null,
): string {
    const viewConfig = configService.parse<NodeViewConfig>(node.view_config, {});
    if (viewConfig?.label) return truncate(viewConfig.label);

    const content = node.content.trim();
    if (isResourceNodeType(node.type)) {
        const resourceName = metadata?.display_name ?? fallbackResourceName(content);
        return truncate(resourceName || node.type);
    }
    if (content) {
        return truncate(takeFirstLine(content));
    }
    return node.type;
}
