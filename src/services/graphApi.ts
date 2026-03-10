import { invoke } from "@tauri-apps/api/core";
import type { GraphData, Group, Node, NodeResourceMetadata, Relation } from "@/types";

export const graphApi = {
    async getGraphData(projectId: string): Promise<GraphData> {
        return invoke("get_graph_data", { projectId });
    },

    async createNode(
        projectId: string,
        nodeType: string,
        content: string,
        x: number,
        y: number,
    ): Promise<Node> {
        return invoke("create_node", { projectId, nodeType, content, x, y });
    },

    async updateNode(id: string, nodeType: string, content: string): Promise<Node> {
        return invoke("update_node", { id, nodeType, content });
    },

    async updateNodePosition(id: string, x: number, y: number): Promise<void> {
        return invoke("update_node_position", { id, x, y });
    },

    async updateNodeViewConfig(id: string, config: string | null): Promise<void> {
        return invoke("update_node_view_config", { id, config });
    },

    async updateNodeSemanticConfig(id: string, config: string | null): Promise<void> {
        return invoke("update_node_semantic_config", { id, config });
    },

    async deleteNode(id: string): Promise<void> {
        return invoke("delete_node", { id });
    },

    async searchNodes(projectId: string, query: string): Promise<Node[]> {
        return invoke("search_nodes", { projectId, query });
    },

    async batchDeleteNodes(ids: string[]): Promise<void> {
        return invoke("batch_delete_nodes", { ids });
    },

    async getNodeResourceMetadata(nodeId: string): Promise<NodeResourceMetadata> {
        return invoke("get_node_resource_metadata", { nodeId });
    },

    async createRelation(
        projectId: string,
        sourceId: string,
        targetId: string,
        relationType: string,
        content: string | null,
        semanticConfig: string | null,
        viewConfig: string | null,
    ): Promise<Relation> {
        return invoke("create_relation", {
            projectId,
            sourceId,
            targetId,
            relationType,
            content,
            semanticConfig,
            viewConfig,
        });
    },

    async updateRelation(
        id: string,
        relationType: string,
        content: string | null,
        semanticConfig: string | null,
        viewConfig: string | null,
    ): Promise<Relation> {
        return invoke("update_relation", {
            id,
            relationType,
            content,
            semanticConfig,
            viewConfig,
        });
    },

    async updateRelationViewConfig(id: string, config: string | null): Promise<void> {
        return invoke("update_relation_view_config", { id, config });
    },

    async updateRelationSemanticConfig(id: string, config: string | null): Promise<void> {
        return invoke("update_relation_semantic_config", { id, config });
    },

    async deleteRelation(id: string): Promise<void> {
        return invoke("delete_relation", { id });
    },

    async createGroup(projectId: string, name: string, color: string): Promise<Group> {
        return invoke("create_group", { projectId, name, color });
    },

    async updateGroup(id: string, name: string, color: string): Promise<Group> {
        return invoke("update_group", { id, name, color });
    },

    async deleteGroup(id: string): Promise<void> {
        return invoke("delete_group", { id });
    },

    async addNodeToGroup(groupId: string, nodeId: string): Promise<void> {
        return invoke("add_node_to_group", { groupId, nodeId });
    },

    async removeNodeFromGroup(groupId: string, nodeId: string): Promise<void> {
        return invoke("remove_node_from_group", { groupId, nodeId });
    },
};
