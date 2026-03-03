// ─── 数据模型（镜像后端 Rust models.rs） ───

/** 项目 */
export interface Project {
    id: string;
    name: string;
    description: string;
    created_at: number;
    updated_at: number;
}

/** 知识节点 */
export interface Note {
    id: string;
    project_id: string;
    parent_id: string | null;
    title: string;
    x: number;
    y: number;
    depth: number;
    created_at: number;
    updated_at: number;
}

/** 知识关联 */
export interface Link {
    id: string;
    project_id: string;
    source_id: string;
    target_id: string;
    label: string | null;
    direction: string;
    link_type: string;
    weight: number;
    sort_order: number;
    created_at: number;
}

/** 节点属性 */
export interface Property {
    id: string;
    node_id: string;
    prop_type: string;
    prop_key: string;
    value_text: string | null;
    value_number: number | null;
    sort_order: number;
    created_at: number;
}

/** 节点分组 */
export interface Group {
    id: string;
    project_id: string;
    name: string;
    color: string;
    created_at: number;
}

/** 分组成员 */
export interface GroupMember {
    group_id: string;
    note_id: string;
}

/** 完整图谱数据 */
export interface GraphData {
    notes: Note[];
    links: Link[];
    properties: Property[];
    groups: Group[];
    group_members: GroupMember[];
}
