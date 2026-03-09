use crate::application::AppResult;
use crate::db::Database;
use crate::models::Link;

pub struct LinkService<'a> {
    db: &'a Database,
}

impl<'a> LinkService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(
        &self,
        project_id: &str,
        source_id: &str,
        target_id: &str,
        label: Option<&str>,
        direction: &str,
        link_type: &str,
        weight: f64,
        sort_order: i64,
    ) -> AppResult<Link> {
        self.db
            .create_link(
                project_id, source_id, target_id, label, direction, link_type, weight, sort_order,
            )
            .map_err(Into::into)
    }

    pub fn update(
        &self,
        id: &str,
        label: Option<&str>,
        direction: &str,
        link_type: &str,
        weight: f64,
        sort_order: i64,
    ) -> AppResult<Link> {
        self.db
            .update_link(id, label, direction, link_type, weight, sort_order)
            .map_err(Into::into)
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        self.db.delete_link(id).map_err(Into::into)
    }

    pub fn update_config(&self, id: &str, config: Option<&str>) -> AppResult<()> {
        self.db.update_link_config(id, config).map_err(Into::into)
    }
}
