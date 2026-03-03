use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vendor {
    pub id: String,
    pub domains: Vec<String>,
    pub name: String,
    pub company: String,
    pub category: String,
    pub gdpr_compliant: bool,
    pub dpa_url: Option<String>,
    pub privacy_policy: Option<String>,
    pub purpose: Option<String>,
    pub data_collected: Option<Vec<String>>,
    pub retention_period: Option<String>,
    pub last_verified: Option<String>,
    pub risk_score: u8,
    pub alternatives: Option<Vec<String>>,
    pub tier: Option<String>,
    #[serde(flatten)]
    pub extra: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub description: String,
    pub risk_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VendorDatabase {
    pub version: String,
    pub last_updated: String,
    pub vendors: Vec<Vendor>,
    pub categories: Vec<Category>,
}
