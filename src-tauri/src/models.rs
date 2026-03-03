use serde::{Deserialize, Serialize};

/// 项目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 知识节点（纯粹的图谱实体）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub project_id: String,
    pub parent_id: Option<String>,   // null = 顶级节点
    pub title: String,
    pub x: f64,
    pub y: f64,
    pub depth: i64,                  // 层级深度 (0 = 顶级)
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
    pub created_at: i64,
}

/// 节点属性（可扩展的键值对）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Property {
    pub id: String,
    pub node_id: String,
    pub prop_type: String,            // "text" | "file" | "number" | "date" | "tag"
    pub prop_key: String,             // "content" | "summary" | "attachment" | ...
    pub value_text: Option<String>,
    pub value_number: Option<f64>,
    pub sort_order: i64,
    pub created_at: i64,
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
    pub note_id: String,
}

/// 完整的图谱数据（按项目 + 层级加载）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphData {
    pub notes: Vec<Note>,
    pub links: Vec<Link>,
    pub properties: Vec<Property>,
    pub groups: Vec<Group>,
    pub group_members: Vec<GroupMember>,
}
