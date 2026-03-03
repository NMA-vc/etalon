use url::Url;

pub fn extract_domain(url_str: &str) -> Option<String> {
    if url_str.starts_with("data:") || url_str.starts_with("blob:") || url_str.starts_with("about:")
    {
        return None;
    }

    if let Ok(url) = Url::parse(url_str)
        && let Some(host) = url.host_str()
    {
        return Some(host.to_lowercase());
    }
    None
}

pub fn get_parent_domains(domain: &str) -> Vec<String> {
    let parts: Vec<&str> = domain.split('.').collect();
    let mut parents = Vec::new();

    if parts.len() <= 2 {
        return parents;
    }

    for i in 1..(parts.len() - 1) {
        parents.push(parts[i..].join("."));
    }

    parents
}

pub fn is_first_party(request_domain: &str, site_domain: &str) -> bool {
    let req_lower = request_domain.to_lowercase();
    let site_lower = site_domain.to_lowercase();

    if req_lower == site_lower {
        return true;
    }

    if req_lower.ends_with(&format!(".{}", site_lower)) {
        return true;
    }

    false
}

pub fn normalize_url(url: &str) -> String {
    let normalized = url.trim();
    if !normalized.to_lowercase().starts_with("http://")
        && !normalized.to_lowercase().starts_with("https://")
    {
        return format!("https://{}", normalized);
    }
    normalized.to_string()
}
