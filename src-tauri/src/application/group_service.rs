use crate::application::AppResult;
use crate::db::Database;
use crate::models::Group;

pub struct GroupService<'a> {
    db: &'a Database,
}

impl<'a> GroupService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(&self, project_id: &str, name: &str, color: &str) -> AppResult<Group> {
        self.db
            .create_group(project_id, name, color)
            .map_err(Into::into)
    }

    pub fn update(&self, id: &str, name: &str, color: &str) -> AppResult<Group> {
        self.db.update_group(id, name, color).map_err(Into::into)
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        self.db.delete_group(id).map_err(Into::into)
    }

    pub fn add_node(&self, group_id: &str, node_id: &str) -> AppResult<()> {
        self.db
            .add_node_to_group(group_id, node_id)
            .map_err(Into::into)
    }

    pub fn remove_node(&self, group_id: &str, node_id: &str) -> AppResult<()> {
        self.db
            .remove_node_from_group(group_id, node_id)
            .map_err(Into::into)
    }
}
