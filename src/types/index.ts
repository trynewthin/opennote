export interface Project {
    id: string;
    name: string;
    description: string;
    config: string | null;
    created_at: number;
    updated_at: number;
}

export interface Node {
    id: string;
    project_id: string;
    node_type: string;
    content: string;
    semantic_config: string | null;
    view_config: string | null;
    created_at: number;
    updated_at: number;
}

export interface Relation {
    id: string;
    project_id: string;
    source_id: string;
    target_id: string;
    relation_type: string;
    content: string | null;
    semantic_config: string | null;
    view_config: string | null;
    created_at: number;
}

export interface Group {
    id: string;
    project_id: string;
    name: string;
    color: string;
    created_at: number;
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

export interface NodeViewConfig {
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
    [key: string]: unknown;
}

export interface RelationViewConfig {
    relX?: number;
    relY?: number;
    sortOrder?: number;
    color?: string;
    colorDark?: string;
    width?: number;
    dashArray?: string;
    opacity?: number;
    [key: string]: unknown;
}

export interface RelationSemanticConfig {
    direction?: "none" | "forward" | "backward";
    weight?: number;
    [key: string]: unknown;
}

export interface NodeResourceMetadata {
    node_id: string;
    resolved_path: string | null;
    display_name: string | null;
    exists: boolean;
    mime_type: string | null;
    size_bytes: number | null;
}
