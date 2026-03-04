import { invoke } from "@tauri-apps/api/core";
import type { Node, GraphData } from "@/types";

// ─── Node / Graph API ───

export async function getGraphData(
    projectId: string
): Promise<GraphData> {
    return invoke<GraphData>("get_graph_data", {
        projectId,
    });
}

export async function createNode(
    projectId: string,
    title: string,
    x: number,
    y: number
): Promise<Node> {
    return invoke<Node>("create_node", { projectId, title, x, y });
}

export async function updateNode(id: string, title: string): Promise<Node> {
    return invoke<Node>("update_node", { id, title });
}

export async function updateNodePosition(
    id: string,
    x: number,
    y: number
): Promise<void> {
    return invoke<void>("update_node_position", { id, x, y });
}

export async function deleteNode(id: string): Promise<void> {
    return invoke<void>("delete_node", { id });
}

export async function searchNodes(
    projectId: string,
    query: string
): Promise<Node[]> {
    return invoke<Node[]>("search_nodes", { projectId, query });
}

export async function batchDeleteNodes(ids: string[]): Promise<void> {
    return invoke<void>("batch_delete_nodes", { ids });
}
