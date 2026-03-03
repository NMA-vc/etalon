use crate::fetcher::Signals;
use crate::fingerprints::FingerprintDB;
use crate::types::{DetectedTech, DetectionMethod};

pub fn match_all(signals: &Signals, db: &FingerprintDB) -> Vec<DetectedTech> {
    let mut detected = Vec::new();

    for tech in &db.techs {
        if let Some(ref raw) = tech.raw {
            if let Some(headers) = &raw.headers {
                for (k, v) in headers {
                    if let Some(sig_v) = signals.headers.get(&k.to_lowercase())
                        && (sig_v.contains(v) || v.is_empty())
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
            if let Some(cookies) = &raw.cookies {
                for k in cookies.keys() {
                    if signals.cookies.contains(&k.to_lowercase()) {
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
    }
    detected
}
