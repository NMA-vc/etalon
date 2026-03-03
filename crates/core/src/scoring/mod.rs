pub mod context_detector;
pub mod industry_rules;
pub mod region_rules;

pub use context_detector::*;
pub use industry_rules::*;
pub use region_rules::*;

use serde::{Deserialize, Serialize};
use std::cmp::max;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditFinding {
    pub rule: String,
    pub category: String,
    pub severity: String,
    pub file: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoringContext {
    pub project_context: ProjectContext,
    pub adjusted_findings: Vec<AuditFinding>,
    pub adjustments: Vec<AdjustmentInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdjustmentInfo {
    pub finding_rule: String,
    pub original_severity: String,
    pub adjusted_severity: String,
    pub reason: String,
}

pub fn adjust_finding_severity(
    finding: &AuditFinding,
    context: &ProjectContext,
) -> (String, Option<String>) {
    let order = ["info", "low", "medium", "high", "critical"];
    let current_index = order
        .iter()
        .position(|&s| s == finding.severity.as_str())
        .unwrap_or(0);

    let ind_adj = get_industry_adjustment(&context.industry, &finding.category);
    let reg_adj = get_region_adjustment(&context.region, &finding.category);

    let total_adj = max(ind_adj, reg_adj);
    if total_adj == 0 {
        return (finding.severity.clone(), None);
    }

    let mut steps = 0;
    if total_adj >= 4 {
        steps = 2;
    } else if total_adj >= 2 {
        steps = 1;
    }

    let mut new_index = current_index + steps;
    if new_index >= order.len() {
        new_index = order.len() - 1;
    }
    let new_severity = order[new_index].to_string();

    if new_severity == finding.severity {
        return (finding.severity.clone(), None);
    }

    let mut reasons = Vec::new();
    if ind_adj > 0 {
        reasons.push(format!("{} industry (+{})", context.industry, ind_adj));
    }
    if reg_adj > 0 {
        let reg_type = if context.region == "eu" {
            "GDPR"
        } else {
            "regulations"
        };
        reasons.push(format!(
            "{} region / {} (+{})",
            context.region, reg_type, reg_adj
        ));
    }

    (
        new_severity,
        Some(format!("Elevated: {}", reasons.join(", "))),
    )
}
