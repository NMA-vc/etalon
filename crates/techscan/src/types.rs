use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum StringOrVec {
    String(String),
    Vec(Vec<String>),
}

#[derive(Debug, Deserialize)]
pub struct RawFingerprint {
    pub website: Option<String>,
    pub cats: Option<Vec<u32>>,
    pub headers: Option<HashMap<String, String>>,
    pub cookies: Option<HashMap<String, String>>,
    pub html: Option<StringOrVec>,
    pub script_src: Option<StringOrVec>,
    pub meta: Option<HashMap<String, StringOrVec>>,
    pub dns: Option<HashMap<String, StringOrVec>>,
    pub implies: Option<StringOrVec>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DetectedTech {
    pub name: String,
    pub categories: Vec<u32>,
    pub confidence: u8, // 0-100
    pub version: Option<String>,
    pub via: DetectionMethod,
}

#[derive(Debug, Clone, Serialize)]
pub enum DetectionMethod {
    Header(String),
    Cookie(String),
    Html,
    ScriptSrc,
    Meta,
    Dns,
    Implied(String),
}

#[derive(Debug, Serialize)]
pub struct ScanResult {
    pub domain: String,
    pub techs: Vec<DetectedTech>,
    pub scanned_at: chrono::DateTime<chrono::Utc>,
    pub scan_ms: u64,
    pub error: Option<String>,
}
