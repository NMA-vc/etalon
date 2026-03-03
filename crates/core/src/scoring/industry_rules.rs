use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndustryRule {
    pub industry: String,
    pub severity_modifier: u32,
    pub description: String,
    pub tracker_category_overrides: HashMap<String, u32>,
    pub required_disclosures: Vec<String>,
}

pub fn get_industry_rule(industry: &str) -> IndustryRule {
    let mut overrides = HashMap::new();

    match industry {
        "healthcare" => {
            overrides.insert("analytics".to_string(), 3);
            overrides.insert("advertising".to_string(), 5);
            overrides.insert("marketing".to_string(), 4);
            overrides.insert("social".to_string(), 3);
            IndustryRule {
                industry: "healthcare".into(),
                severity_modifier: 2,
                description: "HIPAA requires strict control".into(),
                tracker_category_overrides: overrides,
                required_disclosures: vec!["HIPAA BAA required".into()],
            }
        }
        "finance" => {
            overrides.insert("session_replay".to_string(), 4);
            IndustryRule {
                industry: "finance".into(),
                severity_modifier: 2,
                description: "PCI-DSS requires control".into(),
                tracker_category_overrides: overrides,
                required_disclosures: vec!["PCI-DSS scope".into()],
            }
        }
        _ => IndustryRule {
            industry: "general".into(),
            severity_modifier: 0,
            description: "Standard project".into(),
            tracker_category_overrides: overrides,
            required_disclosures: vec![],
        },
    }
}

pub fn get_industry_adjustment(industry: &str, tracker_category: &str) -> u32 {
    let rule = get_industry_rule(industry);
    let override_val = rule
        .tracker_category_overrides
        .get(tracker_category)
        .unwrap_or(&0);
    override_val + rule.severity_modifier
}
