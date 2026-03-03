use crate::types::{RawFingerprint, StringOrVec};
use anyhow::Result;
use regex::RegexSet;
use std::{collections::HashMap, path::Path};

pub struct CompiledFingerprint {
    pub name: String,
    pub cats: Vec<u32>,
    pub implies: Vec<String>,
    // For a real implementation, we would store regex indices here
    // But for MVP, keeping raw fields allows exact matching implementation later.
    pub raw: Option<RawFingerprint>,
}

impl CompiledFingerprint {
    pub fn new(
        name: String,
        fp: RawFingerprint,
        _headers: &mut Vec<String>,
        _html: &mut Vec<String>,
        _scripts: &mut Vec<String>,
        _cookies: &mut Vec<String>,
    ) -> Self {
        let cats = fp.cats.clone().unwrap_or_default();
        let implies = match &fp.implies {
            Some(StringOrVec::String(s)) => vec![s.clone()],
            Some(StringOrVec::Vec(v)) => v.clone(),
            None => vec![],
        };
        // Simplified constructor taking regex mutable refs
        Self {
            name,
            cats,
            implies,
            raw: Some(fp),
        }
    }
}

pub struct FingerprintDB {
    pub techs: Vec<CompiledFingerprint>,
    pub header_set: RegexSet,
    pub html_set: RegexSet,
    pub script_set: RegexSet,
    pub cookie_set: RegexSet,
}

impl FingerprintDB {
    pub fn load_bundled() -> Result<Self> {
        let raw_content = include_str!("data/technologies.json");

        let mut techs = Vec::new();
        let mut header_patterns = Vec::new();
        let mut html_patterns = Vec::new();
        let mut script_patterns = Vec::new();
        let mut cookie_patterns = Vec::new();
        if let Ok(raw) = serde_json::from_str::<HashMap<String, RawFingerprint>>(raw_content) {
            for (name, fp) in raw {
                let compiled = CompiledFingerprint::new(
                    name,
                    fp,
                    &mut header_patterns,
                    &mut html_patterns,
                    &mut script_patterns,
                    &mut cookie_patterns,
                );
                techs.push(compiled);
            }
        }

        tracing::info!("Loaded {} default bundled fingerprints", techs.len());

        Ok(FingerprintDB {
            header_set: RegexSet::new(&header_patterns)?,
            html_set: RegexSet::new(&html_patterns)?,
            script_set: RegexSet::new(&script_patterns)?,
            cookie_set: RegexSet::new(&cookie_patterns)?,
            techs,
        })
    }

    pub fn empty() -> Self {
        FingerprintDB {
            techs: Vec::new(),
            header_set: RegexSet::empty(),
            html_set: RegexSet::empty(),
            script_set: RegexSet::empty(),
            cookie_set: RegexSet::empty(),
        }
    }

    pub fn load(dir: &Path) -> Result<Self> {
        let mut techs = Vec::new();
        let mut header_patterns = Vec::new();
        let mut html_patterns = Vec::new();
        let mut script_patterns = Vec::new();
        let mut cookie_patterns = Vec::new();

        if !dir.exists() {
            tracing::warn!("Fingerprints dir {:?} not found! Yielding empty DB.", dir);
            return Ok(FingerprintDB {
                techs,
                header_set: RegexSet::empty(),
                html_set: RegexSet::empty(),
                script_set: RegexSet::empty(),
                cookie_set: RegexSet::empty(),
            });
        }

        // Walk fingerprints/technologies/*.json
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.extension().is_some_and(|e| e == "json") {
                let raw_content = std::fs::read_to_string(&path)?;
                if let Ok(raw) =
                    serde_json::from_str::<HashMap<String, RawFingerprint>>(&raw_content)
                {
                    for (name, fp) in raw {
                        let compiled = CompiledFingerprint::new(
                            name,
                            fp,
                            &mut header_patterns,
                            &mut html_patterns,
                            &mut script_patterns,
                            &mut cookie_patterns,
                        );
                        techs.push(compiled);
                    }
                }
            }
        }

        tracing::info!("Loaded {} fingerprints", techs.len());

        Ok(FingerprintDB {
            header_set: RegexSet::new(&header_patterns)?,
            html_set: RegexSet::new(&html_patterns)?,
            script_set: RegexSet::new(&script_patterns)?,
            cookie_set: RegexSet::new(&cookie_patterns)?,
            techs,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fingerprint_db_empty() {
        let db = FingerprintDB::empty();
        assert!(
            db.techs.is_empty(),
            "Empty DB should have no technologies mapped out-of-the-box"
        );
    }
}
