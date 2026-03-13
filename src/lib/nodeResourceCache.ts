import { workspaceApi } from "@/services/workspaceApi";
import type { NodeResourceMetadata } from "@/types";

const metadataCache = new Map<string, NodeResourceMetadata>();
const pendingCache = new Map<string, Promise<NodeResourceMetadata>>();

function cacheKey(projectPath: string, nodeId: string): string {
    return `${projectPath}::${nodeId}`;
}

export async function loadNodeResourceMetadata(projectPath: string, nodeId: string): Promise<NodeResourceMetadata> {
    const key = cacheKey(projectPath, nodeId);
    const cached = metadataCache.get(key);
    if (cached) return cached;

    const pending = pendingCache.get(key);
    if (pending) return pending;

    const request = workspaceApi
        .getNodeResourceMetadata(projectPath, nodeId)
        .then((metadata) => {
            metadataCache.set(key, metadata);
            return metadata;
        })
        .finally(() => {
            pendingCache.delete(key);
        });

    pendingCache.set(key, request);
    return request;
}

export function invalidateNodeResourceMetadata(projectPath: string, nodeId: string): void {
    const key = cacheKey(projectPath, nodeId);
    metadataCache.delete(key);
    pendingCache.delete(key);
}
