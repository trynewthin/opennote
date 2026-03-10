use chrono::Utc;
use serde_json::{json, Map, Value};
use uuid::Uuid;

pub fn new_id() -> String {
    Uuid::new_v4().to_string()
}

pub fn now_millis() -> i64 {
    Utc::now().timestamp_millis()
}

pub fn parse_json_object(raw: Option<&str>) -> Map<String, Value> {
    raw.and_then(|value| serde_json::from_str::<Value>(value).ok())
        .and_then(|value| value.as_object().cloned())
        .unwrap_or_default()
}

pub fn stringify_json_object(map: Map<String, Value>) -> Option<String> {
    if map.is_empty() {
        None
    } else {
        Some(Value::Object(map).to_string())
    }
}

pub fn with_xy(raw: Option<&str>, x: f64, y: f64) -> Option<String> {
    let mut map = parse_json_object(raw);
    map.insert("x".to_string(), json!(x));
    map.insert("y".to_string(), json!(y));
    stringify_json_object(map)
}
