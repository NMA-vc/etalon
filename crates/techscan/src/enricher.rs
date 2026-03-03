use crate::fingerprints::FingerprintDB;
use crate::types::{DetectedTech, DetectionMethod};
use std::collections::HashMap;

pub fn resolve_implies(mut techs: Vec<DetectedTech>, db: &FingerprintDB) -> Vec<DetectedTech> {
    let mut added = true;
    let mut implied_techs = HashMap::new();

    let mut tech_map = HashMap::new();
    for t in &db.techs {
        tech_map.insert(t.name.clone(), t);
    }

    while added {
        added = false;
        let current_names: Vec<String> = techs.iter().map(|t| t.name.clone()).collect();

        for t in &techs {
            if let Some(db_tech) = tech_map.get(&t.name) {
                for implied in &db_tech.implies {
                    if !current_names.contains(implied)
                        && !implied_techs.contains_key(implied)
                        && let Some(impl_db) = tech_map.get(implied)
                    {
                        implied_techs.insert(
                            implied.clone(),
                            DetectedTech {
                                name: impl_db.name.clone(),
                                categories: impl_db.cats.clone(),
                                confidence: t.confidence,
                                version: None,
                                via: DetectionMethod::Implied(t.name.clone()),
                            },
                        );
                        added = true;
                    }
                }
            }
        }

        for (_, new_tech) in implied_techs.drain() {
            techs.push(new_tech);
        }
    }

    techs
}
