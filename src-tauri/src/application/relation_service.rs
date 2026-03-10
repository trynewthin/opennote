use crate::application::AppResult;
use crate::db::Database;
use crate::models::Relation;

pub struct RelationService<'a> {
    db: &'a Database,
}

impl<'a> RelationService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create(
        &self,
        project_id: &str,
        source_id: &str,
        target_id: &str,
        relation_type: &str,
        content: Option<&str>,
        semantic_config: Option<&str>,
        view_config: Option<&str>,
    ) -> AppResult<Relation> {
        self.db
            .create_relation(
                project_id,
                source_id,
                target_id,
                relation_type,
                content,
                semantic_config,
                view_config,
            )
            .map_err(Into::into)
    }

    pub fn update(
        &self,
        id: &str,
        relation_type: &str,
        content: Option<&str>,
        semantic_config: Option<&str>,
        view_config: Option<&str>,
    ) -> AppResult<Relation> {
        self.db
            .update_relation(id, relation_type, content, semantic_config, view_config)
            .map_err(Into::into)
    }

    pub fn delete(&self, id: &str) -> AppResult<()> {
        self.db.delete_relation(id).map_err(Into::into)
    }

    pub fn update_view_config(&self, id: &str, config: Option<&str>) -> AppResult<()> {
        self.db
            .update_relation_view_config(id, config)
            .map_err(Into::into)
    }

    pub fn update_semantic_config(&self, id: &str, config: Option<&str>) -> AppResult<()> {
        self.db
            .update_relation_semantic_config(id, config)
            .map_err(Into::into)
    }
}
