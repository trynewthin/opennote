// ─── 数据模型（镜像后端 Rust models.rs） ───

/** 项目 */
export interface Project {
    id: string;
    name: string;
    description: string;
    config: string | null;
    created_at: number;
    updated_at: number;
}

/** 知识节点 */
export interface Node {
    id: string;
    project_id: string;
    title: string;
    x: number;
    y: number;
    config: string | null;
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
    config: string | null;
    created_at: number;
}

/** 节点内容（文本/图片/音频/视频/文件） */
export interface Content {
    id: string;
    project_id: string;
    content_type: string;
    value_text: string | null;
    value_number: number | null;
    config: string | null;
    created_at: number;
}

/** 节点与内容关联 */
export interface NodeContentRel {
    node_id: string;
    content_id: string;
    sort_order: number;
    rel_x: number;
    rel_y: number;
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
    node_id: string;
}

/** 完整图谱数据 */
export interface GraphData {
    nodes: Node[];
    links: Link[];
    contents: Content[];
    node_content_rels: NodeContentRel[];
    groups: Group[];
    group_members: GroupMember[];
}
