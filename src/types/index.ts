export type JsonObject = Record<string, unknown>;

export interface ProjectSummary {
    path: string;
    name: string;
    description: string;
    updated_at: number;
    node_count: number;
}

export interface ProjectData {
    on_version: string;
    name: string;
    description: string;
    config: JsonObject;
    nodes: Node[];
    relations: Relation[];
    groups: Group[];
    group_members: GroupMember[];
}

export interface LoadedProject {
    path: string;
    data: ProjectData;
}

export interface Node {
    id: string;
    type: string;
    content: string;
    semantic_config: JsonObject | null;
    view_config: JsonObject | null;
}

export interface Relation {
    id: string;
    source: string;
    target: string;
    type: string;
    content: string | null;
    semantic_config: JsonObject | null;
    view_config: JsonObject | null;
}

export interface Group {
    id: string;
    name: string;
    color: string;
}

export interface GroupMember {
    group_id: string;
    node_id: string;
}

export interface GraphData {
    nodes: Node[];
    relations: Relation[];
    groups: Group[];
    group_members: GroupMember[];
}

export interface NodeViewConfig extends JsonObject {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    collapsed?: boolean;
    color?: string;
    colorDark?: string;
    bgColor?: string;
    bgColorDark?: string;
    borderColor?: string;
    borderColorDark?: string;
    fontSize?: number;
    fontWeight?: string | number;
    opacity?: number;
    label?: string;
}

export interface RelationViewConfig extends JsonObject {
    relX?: number;
    relY?: number;
    sortOrder?: number;
    color?: string;
    colorDark?: string;
    width?: number;
    dashArray?: string;
    opacity?: number;
}

export interface RelationSemanticConfig extends JsonObject {
    direction?: "none" | "forward" | "backward";
    weight?: number;
}

export interface WorkspaceFileEntry {
    path: string;
    name: string;
    kind: "file" | "directory";
    children: WorkspaceFileEntry[];
}

export interface AppSettings {
    language: string | null;
    theme: "light" | "dark" | null;
    recent_workspaces: string[];
    last_workspace: string | null;
}

export interface NodeResourceMetadata {
    node_id: string;
    resolved_path: string | null;
    display_name: string | null;
    exists: boolean;
    mime_type: string | null;
    size_bytes: number | null;
}
