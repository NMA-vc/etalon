use crate::auto_fix::detection::{
    find_function_calls, find_next_script_tags, find_script_tags, wrap_call_in_consent,
    wrap_code_in_consent,
};
use crate::auto_fix::types::FixSuggestion;

pub struct TrackerDef {
    pub id: &'static str,
    pub name: &'static str,
    pub consent_category: &'static str,
    pub script_domains: Vec<&'static str>,
    pub function_patterns: Vec<&'static str>,
}

lazy_static::lazy_static! {
    pub static ref TRACKER_DEFS: Vec<TrackerDef> = vec![
        TrackerDef {
            id: "google-analytics",
            name: "Google Analytics",
            consent_category: "analytics",
            script_domains: vec![
                r"googletagmanager\.com/gtag/js",
                r"google-analytics\.com/analytics\.js",
                r"google-analytics\.com/ga\.js",
            ],
            function_patterns: vec![r"\bgtag\s*\(", r"\bga\s*\("],
        },
        TrackerDef {
            id: "facebook-pixel",
            name: "Facebook Pixel",
            consent_category: "marketing",
            script_domains: vec![r"connect\.facebook\.net/.*/fbevents\.js"],
            function_patterns: vec![r"\bfbq\b"],
        }
    ];
}

pub fn detect_trackers(code: &str, framework: &str) -> Vec<FixSuggestion> {
    let mut suggestions = Vec::new();

    for def in TRACKER_DEFS.iter() {
        let mut locations = Vec::new();

        for domain in &def.script_domains {
            if framework == "nextjs" {
                locations.extend(find_next_script_tags(code, domain));
            }
            locations.extend(find_script_tags(code, domain));
        }

        for func in &def.function_patterns {
            locations.extend(find_function_calls(code, func));
        }

        for loc in locations {
            let fixed = if loc.context == "hook" || loc.context == "inline" {
                wrap_call_in_consent(&loc.code, code, framework, def.consent_category)
            } else {
                wrap_code_in_consent(&loc.code, code, framework, def.consent_category)
            };

            suggestions.push(FixSuggestion {
                tracker_id: def.id.to_string(),
                tracker_name: def.name.to_string(),
                location: loc.clone(),
                framework: framework.to_string(),
                violation_type: "no_consent".to_string(),
                description: format!("{} loads without user consent.", def.name),
                preview: crate::auto_fix::types::FixPreview {
                    before: loc.code.clone(),
                    after: fixed,
                },
            });
        }
    }

    suggestions
}
