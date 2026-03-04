use serde::{Deserialize, Serialize};

/// 项目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub config: Option<String>,      // JSON 主题/配置
    pub created_at: i64,
    pub updated_at: i64,
}

/// 知识节点（纯粹的图谱实体）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub x: f64,
    pub y: f64,
    pub config: Option<String>,      // JSON 主题/配置
    pub created_at: i64,
    pub updated_at: i64,
}

/// 知识关联
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Link {
    pub id: String,
    pub project_id: String,
    pub source_id: String,
    pub target_id: String,
    pub label: Option<String>,
    pub direction: String,
    pub link_type: String,
    pub weight: f64,
    pub sort_order: i64,
    pub config: Option<String>,      // JSON 主题/配置
    pub created_at: i64,
}

/// 节点内容（文本、图片、音频、视频、文件等）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Content {
    pub id: String,
    pub project_id: String,
    pub content_type: String,       // "text" | "image" | "audio" | "video" | "file"
    pub value_text: Option<String>,
    pub value_number: Option<f64>,
    pub config: Option<String>,      // JSON 主题/配置
    pub created_at: i64,
}

/// 节点与内容的关联关系
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeContentRel {
    pub node_id: String,
    pub content_id: String,
    pub sort_order: i64,
    pub rel_x: f64,
    pub rel_y: f64,
}

/// 节点分组
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub color: String,
    pub created_at: i64,
}

/// 分组成员
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupMember {
    pub group_id: String,
    pub node_id: String,
}

/// 完整的图谱数据（按项目加载）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphData {
    pub nodes: Vec<Node>,
    pub links: Vec<Link>,
    pub contents: Vec<Content>,
    pub node_content_rels: Vec<NodeContentRel>,
    pub groups: Vec<Group>,
    pub group_members: Vec<GroupMember>,
}

/// 导出时的项目元数据（不含 id / 时间戳）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectExportMeta {
    pub name: String,
    pub description: String,
    pub config: Option<String>,
}

/// 完整项目导出结构（序列化到 .on 内的 manifest.json）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectExport {
    pub version: String,
    pub exported_at: String,
    pub project: ProjectExportMeta,
    pub graph: GraphData,
}
