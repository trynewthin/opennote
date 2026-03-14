import { create } from "zustand";
import { invalidateNodeResourceMetadata } from "@/lib/nodeResourceCache";
import { workspaceApi } from "@/services/workspaceApi";
import { configService } from "@/services/configService";
import type {
    Group,
    GroupMember,
    JsonObject,
    Node,
    NodeViewConfig,
    ProjectData,
    Relation,
    RelationSemanticConfig,
} from "@/types";

function zoomAroundCenter(t: Transform, _oldScale: number, newScale: number): Transform {
    const canvas = document.querySelector(".graph-canvas");
    const vw = canvas?.clientWidth ?? window.innerWidth;
    const vh = canvas?.clientHeight ?? window.innerHeight;
    const cx = (vw / 2 - t.x) / t.scale;
    const cy = (vh / 2 - t.y) / t.scale;
    return {
        x: vw / 2 - cx * newScale,
        y: vh / 2 - cy * newScale,
        scale: newScale,
    };
}

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
    zone?: string;
    targetId?: string;
}

interface SelectionState {
    type: "node" | "relation" | null;
    id: string | null;
}

interface GraphState {
    projectPath: string | null;
    skipNextPersistForPath: string | null;
    projectName: string;
    projectDescription: string;
    projectConfig: JsonObject;
    nodes: Node[];
    relations: Relation[];
    groups: Group[];
    groupMembers: GroupMember[];
    transform: Transform;
    selection: SelectionState;
    contextMenu: ContextMenuState;
    editingNodeId: string | null;
    editNodeDialog: { open: boolean; nodeId: string | null };
    loadProject: (projectPath: string) => Promise<void>;
    clearLoadedProject: () => void;
    createNode: (content: string, nodeType?: string) => Promise<void>;
    createFileNodes: (sourcePaths: string[]) => Promise<void>;
    deleteNode: (nodeId: string) => Promise<void>;
    updateNode: (nodeId: string, nodeType: string, content: string) => Promise<void>;
    updateNodePosition: (nodeId: string, x: number, y: number) => Promise<void>;
    updateNodeViewConfig: (nodeId: string, patch: Partial<NodeViewConfig>) => Promise<void>;
    createRelation: (sourceId: string, targetId: string, relationType?: string) => Promise<void>;
    updateRelation: (
        relationId: string,
        content: string | null,
        direction: "none" | "forward" | "backward",
    ) => Promise<void>;
    deleteRelation: (relationId: string) => Promise<void>;
    persistProjectConfig: (patch: Partial<JsonObject>) => Promise<void>;
    suppressNextPersistForProject: (projectPath: string | null) => void;
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

function buildProjectData(state: Pick<GraphState, "projectName" | "projectDescription" | "projectConfig" | "nodes" | "relations" | "groups" | "groupMembers">): ProjectData {
    return {
        on_version: "1",
        name: state.projectName,
        description: state.projectDescription,
        config: state.projectConfig,
        nodes: state.nodes,
        relations: state.relations,
        groups: state.groups,
        group_members: state.groupMembers,
    };
}

async function persistSnapshot(state: GraphState) {
    if (!state.projectPath) return;
    await workspaceApi.saveProject(state.projectPath, buildProjectData(state));
}

export const useGraphStore = create<GraphState>((set, get) => ({
    projectPath: null,
    skipNextPersistForPath: null,
    projectName: "",
    projectDescription: "",
    projectConfig: {},
    nodes: [],
    relations: [],
    groups: [],
    groupMembers: [],
    transform: { x: 0, y: 0, scale: 1 },
    selection: { type: null, id: null },
    contextMenu: { show: false, x: 0, y: 0, worldX: 0, worldY: 0, type: "canvas" },
    editingNodeId: null,
    editNodeDialog: { open: false, nodeId: null },

    setTransform: (transform) => set({ transform }),
    zoomIn: () => set((state) => {
        const oldScale = state.transform.scale;
        const newScale = Math.min(oldScale * 1.2, 4);
        return { transform: zoomAroundCenter(state.transform, oldScale, newScale) };
    }),
    zoomOut: () => set((state) => {
        const oldScale = state.transform.scale;
        const newScale = Math.max(oldScale / 1.2, 0.2);
        return { transform: zoomAroundCenter(state.transform, oldScale, newScale) };
    }),
    resetView: () => set({ transform: { x: 0, y: 0, scale: 1 } }),

    loadProject: async (projectPath) => {
        const loaded = await workspaceApi.loadProject(projectPath);
        set({
            projectPath,
            skipNextPersistForPath: null,
            projectName: loaded.data.name,
            projectDescription: loaded.data.description,
            projectConfig: loaded.data.config,
            nodes: loaded.data.nodes,
            relations: loaded.data.relations,
            groups: loaded.data.groups,
            groupMembers: loaded.data.group_members,
            transform: { x: 0, y: 0, scale: 1 },
            selection: { type: null, id: null },
            editingNodeId: null,
            editNodeDialog: { open: false, nodeId: null },
        });
    },
    clearLoadedProject: () => set({
        projectPath: null,
        skipNextPersistForPath: null,
        projectName: "",
        projectDescription: "",
        projectConfig: {},
        nodes: [],
        relations: [],
        groups: [],
        groupMembers: [],
        transform: { x: 0, y: 0, scale: 1 },
        selection: { type: null, id: null },
        contextMenu: { show: false, x: 0, y: 0, worldX: 0, worldY: 0, type: "canvas" },
        editingNodeId: null,
        editNodeDialog: { open: false, nodeId: null },
    }),

    createNode: async (content, nodeType = "topic") => {
        const { contextMenu } = get();
        const node: Node = {
            id: crypto.randomUUID(),
            type: nodeType,
            content,
            semantic_config: null,
            view_config: { x: contextMenu.worldX || 0, y: contextMenu.worldY || 0 },
        };
        set((state) => ({ nodes: [...state.nodes, node] }));
        await persistSnapshot(get());
    },

    createFileNodes: async (sourcePaths) => {
        const { projectPath, contextMenu } = get();
        if (!projectPath || sourcePaths.length === 0) return;

        const references: string[] = [];
        for (const sourcePath of sourcePaths) {
            references.push(await workspaceApi.copyAttachment(projectPath, sourcePath));
        }

        set((state) => ({
            nodes: [
                ...state.nodes,
                ...references.map((reference, index) => ({
                    id: crypto.randomUUID(),
                    type: "file",
                    content: reference,
                    semantic_config: null,
                    view_config: {
                        x: (contextMenu.worldX || 0) + index * 28,
                        y: (contextMenu.worldY || 0) + index * 28,
                    },
                })),
            ],
        }));

        await persistSnapshot(get());
    },

    deleteNode: async (nodeId) => {
        const { projectPath } = get();
        set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== nodeId),
            relations: state.relations.filter((relation) => relation.source !== nodeId && relation.target !== nodeId),
            groupMembers: state.groupMembers.filter((member) => member.node_id !== nodeId),
            selection: state.selection.id === nodeId ? { type: null, id: null } : state.selection,
        }));
        if (projectPath) invalidateNodeResourceMetadata(projectPath, nodeId);
        await persistSnapshot(get());
    },

    updateNode: async (nodeId, nodeType, content) => {
        const { projectPath } = get();
        set((state) => ({
            nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, type: nodeType, content } : node)),
            editingNodeId: null,
        }));
        if (projectPath) invalidateNodeResourceMetadata(projectPath, nodeId);
        await persistSnapshot(get());
    },

    updateNodePosition: async (nodeId, x, y) => {
        set((state) => ({
            nodes: state.nodes.map((node) => (
                node.id === nodeId
                    ? { ...node, view_config: configService.merge<NodeViewConfig>(node.view_config, { x, y }) }
                    : node
            )),
        }));
        await persistSnapshot(get());
    },

    updateNodeViewConfig: async (nodeId, patch) => {
        set((state) => ({
            nodes: state.nodes.map((node) => (
                node.id === nodeId
                    ? { ...node, view_config: configService.merge<NodeViewConfig>(node.view_config, patch) }
                    : node
            )),
        }));
        await persistSnapshot(get());
    },

    createRelation: async (sourceId, targetId, relationType = "related") => {
        const { relations } = get();
        if (sourceId === targetId) return;
        const exists = relations.some(
            (relation) =>
                relation.type === relationType &&
                ((relation.source === sourceId && relation.target === targetId) ||
                    (relation.source === targetId && relation.target === sourceId)),
        );
        if (exists) return;

        set((state) => ({
            relations: [
                ...state.relations,
                {
                    id: crypto.randomUUID(),
                    source: sourceId,
                    target: targetId,
                    type: relationType,
                    content: null,
                    semantic_config: { direction: "none", weight: 0.5 },
                    view_config: null,
                },
            ],
        }));
        await persistSnapshot(get());
    },

    deleteRelation: async (relationId) => {
        set((state) => ({
            relations: state.relations.filter((relation) => relation.id !== relationId),
            selection: state.selection.id === relationId ? { type: null, id: null } : state.selection,
        }));
        await persistSnapshot(get());
    },

    updateRelation: async (relationId, content, direction) => {
        set((state) => ({
            relations: state.relations.map((relation) => (
                relation.id === relationId
                    ? {
                        ...relation,
                        content,
                        semantic_config: {
                            ...parseRelationSemantic(relation),
                            direction,
                        },
                    }
                    : relation
            )),
        }));
        await persistSnapshot(get());
    },

    persistProjectConfig: async (patch) => {
        const state = get();
        if (state.projectPath && state.skipNextPersistForPath === state.projectPath) {
            set({ skipNextPersistForPath: null });
            return;
        }

        set((state) => ({
            projectConfig: configService.merge<JsonObject>(state.projectConfig, patch),
        }));
        await persistSnapshot(get());
    },
    suppressNextPersistForProject: (projectPath) => set({ skipNextPersistForPath: projectPath }),

    openEditNodeDialog: (nodeId) => set({ editNodeDialog: { open: true, nodeId } }),
    closeEditNodeDialog: () => set({ editNodeDialog: { open: false, nodeId: null } }),
    setSelection: (selection) => set({ selection }),
    openContextMenu: (state) => set({ contextMenu: { ...state, show: true } }),
    closeContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, show: false } })),
    startEditNode: (nodeId) => set({ editingNodeId: nodeId }),
    cancelEditNode: () => set({ editingNodeId: null }),
}));
