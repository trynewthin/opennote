mod group_member_repository;
mod group_repository;
mod mapper;

use crate::db::Database;
use crate::models::{Group, GroupMember};
use rusqlite::Result;

impl Database {
    pub fn create_group(&self, project_id: &str, name: &str, color: &str) -> Result<Group> {
        let conn = self.conn.lock().unwrap();
        group_repository::create(&conn, project_id, name, color)
    }

    pub fn update_group(&self, id: &str, name: &str, color: &str) -> Result<Group> {
        let conn = self.conn.lock().unwrap();
        group_repository::update(&conn, id, name, color)
    }

    pub fn delete_group(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        group_repository::delete(&conn, id)
    }

    pub fn get_groups_by_project(&self, project_id: &str) -> Result<Vec<Group>> {
        let conn = self.conn.lock().unwrap();
        group_repository::list_by_project(&conn, project_id)
    }

    pub fn add_node_to_group(&self, group_id: &str, node_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        group_member_repository::attach_node(&conn, group_id, node_id)
    }

    pub fn remove_node_from_group(&self, group_id: &str, node_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        group_member_repository::detach_node(&conn, group_id, node_id)
    }

    pub fn get_group_members_by_project(&self, project_id: &str) -> Result<Vec<GroupMember>> {
        let conn = self.conn.lock().unwrap();
        group_member_repository::list_by_project(&conn, project_id)
    }
}
