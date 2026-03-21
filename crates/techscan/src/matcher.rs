use crate::fetcher::Signals;
use crate::fingerprints::FingerprintDB;
use crate::types::{DetectedTech, DetectionMethod, StringOrVec};

pub fn match_all(signals: &Signals, db: &FingerprintDB) -> Vec<DetectedTech> {
    let mut detected = Vec::new();
    let mut seen = std::collections::HashSet::new();

    for tech in &db.techs {
        if let Some(ref raw) = tech.raw {
            // --- Header matching ---
            if let Some(headers) = &raw.headers {
                for (k, v) in headers {
                    if let Some(sig_v) = signals.headers.get(&k.to_lowercase())
                        && (v.is_empty() || sig_v.to_lowercase().contains(&v.to_lowercase()))
                        && seen.insert(tech.name.clone())
                    {
                        detected.push(DetectedTech {
                            name: tech.name.clone(),
                            categories: tech.cats.clone(),
                            confidence: 100,
                            version: None,
                            via: DetectionMethod::Header(k.clone()),
                        });
                    }
                }
            }

            // --- Cookie matching ---
            if let Some(cookies) = &raw.cookies {
                for k in cookies.keys() {
                    let k_lower = k.to_lowercase();
                    for cookie_name in &signals.cookies {
                        if cookie_name.to_lowercase().starts_with(&k_lower)
                            && seen.insert(tech.name.clone())
                        {
                            detected.push(DetectedTech {
                                name: tech.name.clone(),
                                categories: tech.cats.clone(),
                                confidence: 100,
                                version: None,
                                via: DetectionMethod::Cookie(k.clone()),
                            });
                        }
                    }
                }
            }

            // --- Script src matching ---
            if let Some(script_patterns) = &raw.script_src {
                let patterns = match script_patterns {
                    StringOrVec::String(s) => vec![s.as_str()],
                    StringOrVec::Vec(v) => v.iter().map(|s| s.as_str()).collect(),
                };
                'script_outer: for pattern in &patterns {
                    for src in &signals.script_srcs {
                        if let Ok(re) = regex::Regex::new(pattern)
                            && re.is_match(src)
                            && seen.insert(tech.name.clone())
                        {
                            detected.push(DetectedTech {
                                name: tech.name.clone(),
                                categories: tech.cats.clone(),
                                confidence: 100,
                                version: None,
                                via: DetectionMethod::ScriptSrc,
                            });
                            break 'script_outer;
                        }
                    }
                }
            }

            // --- Meta tag matching ---
            if let Some(meta) = &raw.meta {
                for (meta_name, meta_pattern) in meta {
                    if let Some(meta_val) = signals.meta_tags.get(&meta_name.to_lowercase()) {
                        let matched = match meta_pattern {
                            StringOrVec::String(s) => {
                                s.is_empty() || meta_val.to_lowercase().contains(&s.to_lowercase())
                            }
                            StringOrVec::Vec(v) => v.iter().any(|s| {
                                s.is_empty() || meta_val.to_lowercase().contains(&s.to_lowercase())
                            }),
                        };
                        if matched && seen.insert(tech.name.clone()) {
                            detected.push(DetectedTech {
                                name: tech.name.clone(),
                                categories: tech.cats.clone(),
                                confidence: 90,
                                version: None,
                                via: DetectionMethod::Meta,
                            });
                        }
                    }
                }
            }

            // --- HTML matching ---
            if let Some(html_patterns) = &raw.html {
                let patterns = match html_patterns {
                    StringOrVec::String(s) => vec![s.as_str()],
                    StringOrVec::Vec(v) => v.iter().map(|s| s.as_str()).collect(),
                };
                for pattern in &patterns {
                    // Try regex first, fall back to plain substring
                    let matched = if let Ok(re) = regex::Regex::new(pattern) {
                        re.is_match(&signals.html)
                    } else {
                        signals.html.contains(*pattern)
                    };
                    if matched && seen.insert(tech.name.clone()) {
                        detected.push(DetectedTech {
                            name: tech.name.clone(),
                            categories: tech.cats.clone(),
                            confidence: 75,
                            version: None,
                            via: DetectionMethod::Html,
                        });
                        break;
                    }
                }
            }
        }
    }
    detected
}
