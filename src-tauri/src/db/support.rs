use chrono::Utc;
use uuid::Uuid;

pub fn new_id() -> String {
    Uuid::new_v4().to_string()
}

pub fn now_millis() -> i64 {
    Utc::now().timestamp_millis()
}
