import { create } from "zustand";
import type { Node, Link, Content, NodeContentRel, Group, GroupMember } from "@/types";
import { graphApi } from "@/services/graphApi";

interface Transform {
    x: number;
    y: number;
    scale: number;
}

interface ContextMenuState {
    show: boolean;
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    type: "canvas" | "node" | "content" | "link";
    targetId?: string;
    parentNodeId?: string;
}

interface SelectionState {
    type: "node" | "content" | "link" | null;
    id: string | null;
}

interface GraphState {
    // 数据层
    nodes: Node[];
    links: Link[];
    contents: Content[];
    nodeContentRels: NodeContentRel[];
    groups: Group[];
    groupMembers: GroupMember[];
    currentProjectId: string | null;

    // 交互呈现层
    transform: Transform;
    expandedNodeIds: string[];
    selection: SelectionState;
    contextMenu: ContextMenuState;
    editingNodeId: string | null;
    addContentDialog: { open: boolean; nodeId: string | null };
    editContentDialog: { open: boolean; contentId: string | null };

    // Action - 初始化与同步
    loadGraphData: (projectId: string) => Promise<void>;
    createNode: (title: string) => Promise<void>;
    deleteNode: (nodeId: string) => Promise<void>;
    renameNode: (nodeId: string, title: string) => Promise<void>;
    updateNodePosition: (nodeId: string, x: number, y: number) => void;
    addContentToNode: (nodeId: string, contentType: string, valueText: string | null) => Promise<void>;
    updateContentRelPosition: (nodeId: string, contentId: string, relX: number, relY: number) => void;

    // Action - 连线
    createLink: (sourceId: string, targetId: string) => Promise<void>;
    updateLink: (linkId: string, label: string | null, direction: string, linkType: string, weight: number, sortOrder: number) => Promise<void>;
    deleteLink: (linkId: string) => Promise<void>;

    // Action - 内容对话框
    openAddContentDialog: (nodeId: string) => void;
    closeAddContentDialog: () => void;
    openEditContentDialog: (contentId: string) => void;
    closeEditContentDialog: () => void;
    updateContent: (contentId: string, contentType: string, valueText: string | null) => Promise<void>;

    // Action - 画布操作
    setTransform: (transform: Transform) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;

    // Action - 展开操作
    toggleNodeExpanded: (nodeId: string) => void;
    setNodeExpanded: (nodeId: string, expanded: boolean) => void;

    // Action - 选中与菜单
    setSelection: (selection: SelectionState) => void;
    openContextMenu: (state: Omit<ContextMenuState, "show">) => void;
    closeContextMenu: () => void;
    startRenameNode: (nodeId: string) => void;
    cancelRename: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
    nodes: [],
    links: [],
    contents: [],
    nodeContentRels: [],
    groups: [],
    groupMembers: [],
    currentProjectId: null,

    transform: { x: 0, y: 0, scale: 1 },
    expandedNodeIds: [],
    selection: { type: null, id: null },
    contextMenu: { show: false, x: 0, y: 0, worldX: 0, worldY: 0, type: "canvas" },
    editingNodeId: null,
    addContentDialog: { open: false, nodeId: null },
    editContentDialog: { open: false, contentId: null as string | null },

    setTransform: (transform) => set({ transform }),
    zoomIn: () => set((s) => ({ transform: { ...s.transform, scale: Math.min(s.transform.scale * 1.2, 4) } })),
    zoomOut: () => set((s) => ({ transform: { ...s.transform, scale: Math.max(s.transform.scale / 1.2, 0.2) } })),
    resetView: () => set({ transform: { x: 0, y: 0, scale: 1 } }),

    loadGraphData: async (projectId: string) => {
        try {
            const data = await graphApi.getGraphData(projectId);
            set({
                currentProjectId: projectId,
                nodes: data.nodes,
                links: data.links,
                contents: data.contents,
                nodeContentRels: data.node_content_rels,
                groups: data.groups,
                groupMembers: data.group_members
            });
        } catch (error) {
            console.error("Failed to load graph data:", error);
        }
    },

    createNode: async (title: string) => {
        const { currentProjectId, contextMenu } = get();
        if (!currentProjectId) return;
        const x = contextMenu.worldX || 0;
        const y = contextMenu.worldY || 0;
        try {
            const node = await graphApi.createNode(currentProjectId, title, x, y);
            set((s) => ({ nodes: [...s.nodes, node] }));
        } catch (error) {
            console.error("Failed to create node:", error);
        }
    },

    deleteNode: async (nodeId: string) => {
        try {
            await graphApi.deleteNode(nodeId);
            set((s) => ({ nodes: s.nodes.filter((n) => n.id !== nodeId) }));
        } catch (error) {
            console.error("Failed to delete node:", error);
        }
    },

    renameNode: async (nodeId: string, title: string) => {
        try {
            await graphApi.updateNode(nodeId, title);
            set((s) => ({
                nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, title } : n)),
                editingNodeId: null,
            }));
        } catch (error) {
            console.error("Failed to rename node:", error);
        }
    },

    updateNodePosition: (nodeId: string, x: number, y: number) => {
        set((s) => ({
            nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
        }));
        graphApi.updateNodePosition(nodeId, x, y).catch((err) => {
            console.error("Failed to persist node position:", err);
        });
    },

    addContentToNode: async (nodeId: string, contentType: string, valueText: string | null) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        try {
            const content = await graphApi.createContent(currentProjectId, contentType, valueText, null);
            const sortOrder = get().nodeContentRels.filter((r) => r.node_id === nodeId).length;
            await graphApi.addContentToNode(nodeId, content.id, sortOrder);
            set((s) => ({
                contents: [...s.contents, content],
                nodeContentRels: [...s.nodeContentRels, { node_id: nodeId, content_id: content.id, sort_order: sortOrder, rel_x: 0, rel_y: 0 }],
                expandedNodeIds: s.expandedNodeIds.includes(nodeId) ? s.expandedNodeIds : [...s.expandedNodeIds, nodeId],
            }));
        } catch (error) {
            console.error("Failed to add content:", error);
        }
    },

    updateContentRelPosition: (nodeId: string, contentId: string, relX: number, relY: number) => {
        set((s) => ({
            nodeContentRels: s.nodeContentRels.map((r) =>
                r.node_id === nodeId && r.content_id === contentId
                    ? { ...r, rel_x: relX, rel_y: relY }
                    : r
            ),
        }));
        graphApi.updateContentRelPosition(nodeId, contentId, relX, relY).catch(console.error);
    },

    openEditContentDialog: (contentId) => set({ editContentDialog: { open: true, contentId } }),
    closeEditContentDialog: () => set({ editContentDialog: { open: false, contentId: null } }),

    updateContent: async (contentId, contentType, valueText) => {
        try {
            const updated = await graphApi.updateContent(contentId, contentType, valueText, null);
            set((s) => ({
                contents: s.contents.map((c) => (c.id === contentId ? updated : c)),
            }));
        } catch (error) {
            console.error("Failed to update content:", error);
        }
    },

    toggleNodeExpanded: (nodeId) => {
        set((state) => {
            const expanded = state.expandedNodeIds.includes(nodeId);
            if (expanded) {
                return { expandedNodeIds: state.expandedNodeIds.filter(id => id !== nodeId) };
            } else {
                return { expandedNodeIds: [...state.expandedNodeIds, nodeId] };
            }
        });
    },

    setNodeExpanded: (nodeId, expanded) => {
        set((state) => {
            const isExpanded = state.expandedNodeIds.includes(nodeId);
            if (expanded && !isExpanded) {
                return { expandedNodeIds: [...state.expandedNodeIds, nodeId] };
            } else if (!expanded && isExpanded) {
                return { expandedNodeIds: state.expandedNodeIds.filter(id => id !== nodeId) };
            }
            return state;
        });
    },

    setSelection: (selection) => set({ selection }),

    openContextMenu: (state) => set({ contextMenu: { ...state, show: true } }),

    closeContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, show: false } })),

    startRenameNode: (nodeId: string) => set({ editingNodeId: nodeId }),
    cancelRename: () => set({ editingNodeId: null }),

    openAddContentDialog: (nodeId: string) => set({ addContentDialog: { open: true, nodeId } }),
    closeAddContentDialog: () => set({ addContentDialog: { open: false, nodeId: null } }),

    createLink: async (sourceId: string, targetId: string) => {
        const { currentProjectId, links } = get();
        if (!currentProjectId) return;
        // 防止重复连线
        const exists = links.some(
            (l) => (l.source_id === sourceId && l.target_id === targetId) ||
                (l.source_id === targetId && l.target_id === sourceId)
        );
        if (exists) return;
        try {
            const link = await graphApi.createLink(currentProjectId, sourceId, targetId, null, "none", "related", 0.5, 0);
            set((s) => ({ links: [...s.links, link] }));
        } catch (error) {
            console.error("Failed to create link:", error);
        }
    },

    deleteLink: async (linkId: string) => {
        try {
            await graphApi.deleteLink(linkId);
            set((s) => ({ links: s.links.filter((l) => l.id !== linkId) }));
        } catch (error) {
            console.error("Failed to delete link:", error);
        }
    },

    updateLink: async (linkId: string, label: string | null, direction: string, linkType: string, weight: number, sortOrder: number) => {
        try {
            const updated = await graphApi.updateLink(linkId, label, direction, linkType, weight, sortOrder);
            set((s) => ({
                links: s.links.map((l) => (l.id === linkId ? updated : l)),
            }));
        } catch (error) {
            console.error("Failed to update link:", error);
        }
    },
}));
