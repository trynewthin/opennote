import { invoke } from "@tauri-apps/api/core";
import type { GraphData, Node, Link, Content, NodeContentRel, Group } from "@/types";

export const graphApi = {
    // --------------------------------------------------------
    // 全局图谱
    // --------------------------------------------------------
    async getGraphData(projectId: string): Promise<GraphData> {
        return invoke("get_graph_data", { projectId });
    },

    // --------------------------------------------------------
    // 节点 Node
    // --------------------------------------------------------
    async createNode(projectId: string, title: string, x: number, y: number): Promise<Node> {
        return invoke("create_node", { projectId, title, x, y });
    },
    async updateNode(id: string, title: string): Promise<Node> {
        return invoke("update_node", { id, title });
    },
    async updateNodePosition(id: string, x: number, y: number): Promise<void> {
        return invoke("update_node_position", { id, x, y });
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

    // --------------------------------------------------------
    // 内容 Content
    // --------------------------------------------------------
    async createContent(projectId: string, contentType: string, valueText: string | null, valueNumber: number | null): Promise<Content> {
        return invoke("create_content", { projectId, contentType, valueText, valueNumber });
    },
    async updateContent(id: string, contentType: string, valueText: string | null, valueNumber: number | null): Promise<Content> {
        return invoke("update_content", { id, contentType, valueText, valueNumber });
    },
    async deleteContent(id: string): Promise<void> {
        return invoke("delete_content", { id });
    },
    async getContentsByProject(projectId: string): Promise<Content[]> {
        return invoke("get_contents_by_project", { projectId });
    },
    // 绑定/解绑
    async addContentToNode(nodeId: string, contentId: string, sortOrder: number): Promise<void> {
        return invoke("add_content_to_node", { nodeId, contentId, sortOrder });
    },
    async removeContentFromNode(nodeId: string, contentId: string): Promise<void> {
        return invoke("remove_content_from_node", { nodeId, contentId });
    },
    async updateContentRelPosition(nodeId: string, contentId: string, relX: number, relY: number): Promise<void> {
        return invoke("update_content_rel_position", { nodeId, contentId, relX, relY });
    },
    async getNodeContentRels(nodeIds: string[]): Promise<NodeContentRel[]> {
        return invoke("get_node_content_rels", { nodeIds });
    },

    // --------------------------------------------------------
    // 连线 Link
    // --------------------------------------------------------
    async createLink(projectId: string, sourceId: string, targetId: string, label: string | null, direction: string, linkType: string, weight: number, sortOrder: number): Promise<Link> {
        return invoke("create_link", { projectId, sourceId, targetId, label, direction, linkType, weight, sortOrder });
    },
    async updateLink(id: string, label: string | null, direction: string, linkType: string, weight: number, sortOrder: number): Promise<Link> {
        return invoke("update_link", { id, label, direction, linkType, weight, sortOrder });
    },
    async deleteLink(id: string): Promise<void> {
        return invoke("delete_link", { id });
    },

    // --------------------------------------------------------
    // 分组 Group
    // --------------------------------------------------------
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
    }
};
