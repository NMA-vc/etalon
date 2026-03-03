use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionRule {
    pub region: String,
    pub regulation: String,
    pub severity_modifier: u32,
    pub consent_required: bool,
    pub right_to_deletion: bool,
    pub data_portability: bool,
    pub breach_notification_hours: Option<u32>,
    pub cross_border_transfer_restricted: bool,
    pub children_age_threshold: u32,
    pub user_rights: Vec<String>,
    pub tracker_adjustments: HashMap<String, u32>,
}

pub fn get_region_rule(region: &str) -> RegionRule {
    let mut tracking_adj = HashMap::new();

    match region {
        "eu" => {
            tracking_adj.insert("analytics".into(), 2);
            tracking_adj.insert("advertising".into(), 3);
            RegionRule {
                region: "eu".into(),
                regulation: "GDPR".into(),
                severity_modifier: 2,
                consent_required: true,
                right_to_deletion: true,
                data_portability: true,
                breach_notification_hours: Some(72),
                cross_border_transfer_restricted: true,
                children_age_threshold: 16,
                user_rights: vec!["Right of access (Art 15)".into(), "Right to erasure".into()],
                tracker_adjustments: tracking_adj,
            }
        }
        "us" => {
            tracking_adj.insert("advertising".into(), 1);
            RegionRule {
                region: "us".into(),
                regulation: "CCPA/CPRA (California)".into(),
                severity_modifier: 1,
                consent_required: false,
                right_to_deletion: true,
                data_portability: true,
                breach_notification_hours: None,
                cross_border_transfer_restricted: false,
                children_age_threshold: 13,
                user_rights: vec!["Right to know".into(), "Right to delete".into()],
                tracker_adjustments: tracking_adj,
            }
        }
        _ => RegionRule {
            region: "unknown".into(),
            regulation: "Unknown - consider GDPR baseline".into(),
            severity_modifier: 1,
            consent_required: true,
            right_to_deletion: true,
            data_portability: false,
            breach_notification_hours: None,
            cross_border_transfer_restricted: false,
            children_age_threshold: 13,
            user_rights: vec![],
            tracker_adjustments: tracking_adj,
        },
    }
}

pub fn get_region_adjustment(region: &str, tracker_category: &str) -> u32 {
    let rule = get_region_rule(region);
    let override_val = rule.tracker_adjustments.get(tracker_category).unwrap_or(&0);
    override_val + rule.severity_modifier
}

pub fn get_user_rights_for_region(region: &str) -> Vec<String> {
    get_region_rule(region).user_rights
}
