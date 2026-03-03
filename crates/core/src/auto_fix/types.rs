use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FixLocation {
    pub file: String,
    pub line: usize,
    pub column: usize,
    pub code: String,
    pub context: String, // "script", "component", "hook", "import", "inline"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FixPreview {
    pub before: String,
    pub after: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FixSuggestion {
    pub tracker_id: String,
    pub tracker_name: String,
    pub location: FixLocation,
    pub framework: String,
    pub violation_type: String,
    pub description: String,
    pub preview: FixPreview,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FixResultChange {
    pub file: String,
    pub before: String,
    pub after: String,
    pub lines_changed: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FixResult {
    pub success: bool,
    pub error: Option<String>,
    pub changes: Option<FixResultChange>,
}
