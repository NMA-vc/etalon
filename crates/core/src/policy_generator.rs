use crate::scoring::get_region_rule;
use crate::types::Vendor;
use chrono::Utc;
use minijinja::{Environment, context};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyOptions {
    pub company: String,
    pub email: String,
    pub website: Option<String>,
    pub dpo_name: Option<String>,
    pub dpo_email: Option<String>,
    pub industry: String,
    pub region: String,
    pub trackers: Vec<Vendor>,
    pub effective_date: Option<String>,
    pub format: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyMetadata {
    pub generated_at: String,
    pub region: String,
    pub regulation: String,
    pub trackers_count: usize,
    pub industry: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedPolicy {
    pub title: String,
    pub markdown_content: String,
    pub metadata: PolicyMetadata,
}

const POLICY_TEMPLATE: &str = r#"
# Privacy Policy — {{ company }}

## 1. Introduction
{{ company }} ("we", "us", or "our") operates{% if website %} the website {{ website }}{% endif %}. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
This policy is designed to comply with **{{ regulation }}** and other applicable privacy regulations.
**Last updated:** {{ effective_date }}
By using our services, you agree to the collection and use of information in accordance with this policy.

## 2. Cookies & Tracking
{% if trackers|length > 0 %}
We use cookies and similar tracking technologies to track activity on our service. The following third-party services are utilized:
{% for tracker in trackers %}
- **{{ tracker.name }}**: {{ tracker.purpose|default("Service functionality and analytics") }}
{% endfor %}
{% else %}
We currently do not use any third-party marketing or analytics trackers on our service.
{% endif %}

## 3. User Rights
{% if user_rights|length > 0 %}
Depending on your location, you may have the following rights regarding your personal data:
{% for right in user_rights %}
- {{ right }}
{% endfor %}
{% endif %}
If you wish to exercise any of these rights, please contact us at {{ email }}{% if dpo_email %} or our Data Protection Officer at {{ dpo_email }}{% endif %}.

## 4. International Data Transfers
{% if cross_border_restricted %}
Some of our third-party service providers are located outside of your jurisdiction. When we transfer your data internationally, we ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) or equivalent adequacy decisions.
{% else %}
Your data may be transferred to and processed in countries other than your own. We take steps to ensure your data is protected wherever it is processed.
{% endif %}

## 5. Children's Privacy
Our services are not directed at children under the age of {{ children_age }}. We do not knowingly collect personal information from children under {{ children_age }}.

## 6. Contact Us
If you have any questions about this Privacy Policy, please contact us:
- By email: {{ email }}
{% if dpo_name %}
- Data Protection Officer: {{ dpo_name }}
{% endif %}
"#;

pub fn generate_privacy_policy(options: &PolicyOptions) -> GeneratedPolicy {
    let region_rule = get_region_rule(&options.region);
    let effective_date = options
        .effective_date
        .clone()
        .unwrap_or_else(|| Utc::now().format("%Y-%m-%d").to_string());

    let env = Environment::new();
    let template_ctx = context!(
        company => options.company,
        website => options.website,
        email => options.email,
        dpo_name => options.dpo_name,
        dpo_email => options.dpo_email,
        regulation => region_rule.regulation,
        effective_date => effective_date,
        trackers => options.trackers,
        user_rights => region_rule.user_rights,
        cross_border_restricted => region_rule.cross_border_transfer_restricted,
        children_age => region_rule.children_age_threshold
    );

    let rendered = env
        .render_named_str("policy.md", POLICY_TEMPLATE, template_ctx)
        .unwrap_or_default();

    GeneratedPolicy {
        title: format!("Privacy Policy — {}", options.company),
        markdown_content: rendered,
        metadata: PolicyMetadata {
            generated_at: Utc::now().to_rfc3339(),
            region: options.region.clone(),
            regulation: region_rule.regulation,
            trackers_count: options.trackers.len(),
            industry: options.industry.clone(),
        },
    }
}
