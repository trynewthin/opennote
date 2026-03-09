use crate::application::AppResult;
use crate::db::Database;
use crate::models::Project;

pub struct ProjectService<'a> {
    db: &'a Database,
}

impl<'a> ProjectService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn list(&self) -> AppResult<Vec<Project>> {
        self.db.get_all_projects().map_err(Into::into)
    }

    pub fn create(&self, name: &str, description: &str) -> AppResult<Project> {
        self.db
            .create_project(name, description)
            .map_err(Into::into)
    }

    pub fn update(&self, id: &str, name: &str, description: &str) -> AppResult<Project> {
        self.db
            .update_project(id, name, description)
            .map_err(Into::into)
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        self.db.delete_project(id).map_err(Into::into)
    }

    pub fn get_node_count(&self, project_id: &str) -> AppResult<i64> {
        self.db
            .get_project_node_count(project_id)
            .map_err(Into::into)
    }

    pub fn update_config(&self, id: &str, config: Option<&str>) -> AppResult<()> {
        self.db
            .update_project_config(id, config)
            .map_err(Into::into)
    }
}
