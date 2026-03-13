use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

fn default_config() -> Value {
    Value::Object(Map::new())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectData {
    pub on_version: String,
    pub name: String,
    pub description: String,
    #[serde(default = "default_config")]
    pub config: Value,
    #[serde(default)]
    pub nodes: Vec<ProjectNode>,
    #[serde(default)]
    pub relations: Vec<ProjectRelation>,
    #[serde(default)]
    pub groups: Vec<ProjectGroup>,
    #[serde(default)]
    pub group_members: Vec<ProjectGroupMember>,
}

impl ProjectData {
    pub fn new(name: &str, description: &str) -> Self {
        Self {
            on_version: "1".into(),
            name: name.into(),
            description: description.into(),
            config: default_config(),
            nodes: Vec::new(),
            relations: Vec::new(),
            groups: Vec::new(),
            group_members: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectNode {
    pub id: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub content: String,
    pub view_config: Option<Value>,
    pub semantic_config: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectRelation {
    pub id: String,
    pub source: String,
    pub target: String,
    #[serde(rename = "type")]
    pub relation_type: String,
    pub content: Option<String>,
    pub view_config: Option<Value>,
    pub semantic_config: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectGroup {
    pub id: String,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectGroupMember {
    pub group_id: String,
    pub node_id: String,
}
