use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectContext {
    pub industry: String,
    pub region: String,
    pub data_sensitivity: String,
    pub handles_children: bool,
    pub handles_health_data: bool,
    pub handles_financial_data: bool,
    pub has_user_accounts: bool,
    pub is_b2b: bool,
    pub detected_signals: Vec<String>,
}

pub fn detect_project_context(_directory: &str) -> ProjectContext {
    ProjectContext {
        industry: "general".into(),
        region: "unknown".into(),
        data_sensitivity: "medium".into(),
        handles_children: false,
        handles_health_data: false,
        handles_financial_data: false,
        has_user_accounts: false,
        is_b2b: false,
        detected_signals: vec!["Detection stub ported from TS".into()],
    }
}
