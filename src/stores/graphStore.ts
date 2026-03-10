import { create } from "zustand";
import { invalidateNodeResourceMetadata } from "@/lib/nodeResourceCache";
import { graphApi } from "@/services/graphApi";
import { configService } from "@/services/configService";
import type {
    Group,
    GroupMember,
    Node,
    NodeViewConfig,
    Relation,
    RelationSemanticConfig,
} from "@/types";

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
    type: "canvas" | "node" | "relation";
    targetId?: string;
}

interface SelectionState {
    type: "node" | "relation" | null;
    id: string | null;
}

interface GraphState {
    nodes: Node[];
    relations: Relation[];
    groups: Group[];
    groupMembers: GroupMember[];
    currentProjectId: string | null;

    transform: Transform;
    selection: SelectionState;
    contextMenu: ContextMenuState;
    editingNodeId: string | null;
    editNodeDialog: { open: boolean; nodeId: string | null };

    loadGraphData: (projectId: string) => Promise<void>;
    createNode: (content: string, nodeType?: string) => Promise<void>;
    deleteNode: (nodeId: string) => Promise<void>;
    updateNode: (nodeId: string, nodeType: string, content: string) => Promise<void>;
    updateNodePosition: (nodeId: string, x: number, y: number) => void;

    createRelation: (sourceId: string, targetId: string, relationType?: string) => Promise<void>;
    updateRelation: (
        relationId: string,
        content: string | null,
        direction: "none" | "forward" | "backward",
    ) => Promise<void>;
    deleteRelation: (relationId: string) => Promise<void>;

    openEditNodeDialog: (nodeId: string) => void;
    closeEditNodeDialog: () => void;

    setTransform: (transform: Transform) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;

    setSelection: (selection: SelectionState) => void;
    openContextMenu: (state: Omit<ContextMenuState, "show">) => void;
    closeContextMenu: () => void;
    startEditNode: (nodeId: string) => void;
    cancelEditNode: () => void;
}

function parseRelationSemantic(relation: Relation): RelationSemanticConfig {
    return configService.parse<RelationSemanticConfig>(relation.semantic_config, {}) ?? {};
}

function patchRaw<T extends Record<string, unknown>>(raw: string | null, patch: Partial<T>): string | null {
    return configService.stringify(configService.merge<T>(raw, patch));
}

export const useGraphStore = create<GraphState>((set, get) => ({
    nodes: [],
    relations: [],
    groups: [],
    groupMembers: [],
    currentProjectId: null,

    transform: { x: 0, y: 0, scale: 1 },
    selection: { type: null, id: null },
    contextMenu: { show: false, x: 0, y: 0, worldX: 0, worldY: 0, type: "canvas" },
    editingNodeId: null,
    editNodeDialog: { open: false, nodeId: null },

    setTransform: (transform) => set({ transform }),
    zoomIn: () => set((state) => ({ transform: { ...state.transform, scale: Math.min(state.transform.scale * 1.2, 4) } })),
    zoomOut: () =>
        set((state) => ({ transform: { ...state.transform, scale: Math.max(state.transform.scale / 1.2, 0.2) } })),
    resetView: () => set({ transform: { x: 0, y: 0, scale: 1 } }),

    loadGraphData: async (projectId: string) => {
        try {
            const data = await graphApi.getGraphData(projectId);
            set({
                currentProjectId: projectId,
                nodes: data.nodes,
                relations: data.relations,
                groups: data.groups,
                groupMembers: data.group_members,
            });
        } catch (error) {
            console.error("Failed to load graph data:", error);
        }
    },

    createNode: async (content: string, nodeType = "concept") => {
        const { currentProjectId, contextMenu } = get();
        if (!currentProjectId) return;
        try {
            const node = await graphApi.createNode(
                currentProjectId,
                nodeType,
                content,
                contextMenu.worldX || 0,
                contextMenu.worldY || 0,
            );
            set((state) => ({ nodes: [...state.nodes, node] }));
        } catch (error) {
            console.error("Failed to create node:", error);
        }
    },

    deleteNode: async (nodeId) => {
        try {
            await graphApi.deleteNode(nodeId);
            invalidateNodeResourceMetadata(nodeId);
            set((state) => ({
                nodes: state.nodes.filter((node) => node.id !== nodeId),
                relations: state.relations.filter(
                    (relation) => relation.source_id !== nodeId && relation.target_id !== nodeId,
                ),
                selection: state.selection.id === nodeId ? { type: null, id: null } : state.selection,
            }));
        } catch (error) {
            console.error("Failed to delete node:", error);
        }
    },

    updateNode: async (nodeId, nodeType, content) => {
        try {
            const updated = await graphApi.updateNode(nodeId, nodeType, content);
            invalidateNodeResourceMetadata(nodeId);
            set((state) => ({
                nodes: state.nodes.map((node) => (node.id === nodeId ? updated : node)),
                editingNodeId: null,
            }));
        } catch (error) {
            console.error("Failed to update node:", error);
        }
    },

    updateNodePosition: (nodeId, x, y) => {
        const node = get().nodes.find((item) => item.id === nodeId);
        if (!node) return;
        const nextViewConfig = patchRaw<NodeViewConfig>(node.view_config, { x, y });
        set((state) => ({
            nodes: state.nodes.map((item) => (item.id === nodeId ? { ...item, view_config: nextViewConfig } : item)),
        }));
        graphApi.updateNodePosition(nodeId, x, y).catch((error) => {
            console.error("Failed to persist node position:", error);
        });
    },

    createRelation: async (sourceId, targetId, relationType = "related") => {
        const { currentProjectId, relations } = get();
        if (!currentProjectId || sourceId === targetId) return;
        const exists = relations.some(
            (relation) =>
                relation.relation_type === relationType &&
                ((relation.source_id === sourceId && relation.target_id === targetId) ||
                    (relation.source_id === targetId && relation.target_id === sourceId)),
        );
        if (exists) return;

        try {
            const relation = await graphApi.createRelation(
                currentProjectId,
                sourceId,
                targetId,
                relationType,
                null,
                configService.stringify({ direction: "none", weight: 0.5 }),
                null,
            );
            set((state) => ({ relations: [...state.relations, relation] }));
        } catch (error) {
            console.error("Failed to create relation:", error);
        }
    },

    deleteRelation: async (relationId) => {
        try {
            await graphApi.deleteRelation(relationId);
            set((state) => ({
                relations: state.relations.filter((relation) => relation.id !== relationId),
                selection: state.selection.id === relationId ? { type: null, id: null } : state.selection,
            }));
        } catch (error) {
            console.error("Failed to delete relation:", error);
        }
    },

    updateRelation: async (relationId, content, direction) => {
        const relation = get().relations.find((item) => item.id === relationId);
        if (!relation) return;
        const semanticConfig = configService.stringify({
            ...parseRelationSemantic(relation),
            direction,
        });
        try {
            const updated = await graphApi.updateRelation(
                relationId,
                relation.relation_type,
                content,
                semanticConfig,
                relation.view_config,
            );
            set((state) => ({
                relations: state.relations.map((item) => (item.id === relationId ? updated : item)),
            }));
        } catch (error) {
            console.error("Failed to update relation:", error);
        }
    },

    openEditNodeDialog: (nodeId) => set({ editNodeDialog: { open: true, nodeId } }),
    closeEditNodeDialog: () => set({ editNodeDialog: { open: false, nodeId: null } }),

    setSelection: (selection) => set({ selection }),
    openContextMenu: (state) => set({ contextMenu: { ...state, show: true } }),
    closeContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, show: false } })),

    startEditNode: (nodeId) => set({ editingNodeId: nodeId }),
    cancelEditNode: () => set({ editingNodeId: null }),
}));
