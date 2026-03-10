import { graphApi } from "@/services/graphApi";
import type { NodeResourceMetadata } from "@/types";

const metadataCache = new Map<string, NodeResourceMetadata>();
const pendingCache = new Map<string, Promise<NodeResourceMetadata>>();

export async function loadNodeResourceMetadata(nodeId: string): Promise<NodeResourceMetadata> {
    const cached = metadataCache.get(nodeId);
    if (cached) return cached;

    const pending = pendingCache.get(nodeId);
    if (pending) return pending;

    const request = graphApi
        .getNodeResourceMetadata(nodeId)
        .then((metadata) => {
            metadataCache.set(nodeId, metadata);
            return metadata;
        })
        .finally(() => {
            pendingCache.delete(nodeId);
        });

    pendingCache.set(nodeId, request);
    return request;
}

export function invalidateNodeResourceMetadata(nodeId: string): void {
    metadataCache.delete(nodeId);
    pendingCache.delete(nodeId);
}
