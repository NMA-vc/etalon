use crate::domain_utils::{extract_domain, get_parent_domains};
use crate::types::{Category, Vendor, VendorDatabase};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

pub struct VendorRegistry {
    pub version: String,
    pub last_updated: String,
    pub vendors: Vec<Vendor>,
    pub categories: Vec<Category>,
    domain_map: HashMap<String, usize>,
}

impl VendorRegistry {
    pub fn load_from_file<P: AsRef<Path>>(path: P) -> anyhow::Result<Self> {
        let raw = fs::read_to_string(path)?;
        let db: VendorDatabase = serde_json::from_str(&raw)?;
        Ok(Self::from_database(db))
    }

    /// Loads the vendor database natively compiled into the binary
    pub fn load_bundled() -> Self {
        // We include the JSON data directly into the binary at compile time.
        let raw_data = include_str!("data/vendors.json");
        let db: VendorDatabase =
            serde_json::from_str(raw_data).expect("Bundled vendors.json is corrupted or invalid");
        Self::from_database(db)
    }

    pub fn from_database(db: VendorDatabase) -> Self {
        let mut domain_map = HashMap::new();

        for (idx, vendor) in db.vendors.iter().enumerate() {
            for domain in &vendor.domains {
                domain_map.insert(domain.to_lowercase(), idx);
            }
        }

        Self {
            version: db.version,
            last_updated: db.last_updated,
            vendors: db.vendors,
            categories: db.categories,
            domain_map,
        }
    }

    pub fn lookup_domain(&self, domain_or_url: &str) -> Option<&Vendor> {
        let domain = if domain_or_url.contains("://") {
            extract_domain(domain_or_url)?
        } else {
            domain_or_url.to_lowercase()
        };

        if let Some(&idx) = self.domain_map.get(&domain) {
            return Some(&self.vendors[idx]);
        }

        for parent in get_parent_domains(&domain) {
            if let Some(&idx) = self.domain_map.get(&parent) {
                return Some(&self.vendors[idx]);
            }
        }

        None
    }

    pub fn get_by_category(&self, category: &str) -> Vec<&Vendor> {
        self.vendors
            .iter()
            .filter(|v| v.category == category)
            .collect()
    }

    pub fn search(&self, query: &str) -> Vec<&Vendor> {
        let q = query.to_lowercase();
        self.vendors
            .iter()
            .filter(|v| {
                v.name.to_lowercase().contains(&q)
                    || v.company.to_lowercase().contains(&q)
                    || v.id.to_lowercase().contains(&q)
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_bundled_registry() {
        let registry = VendorRegistry::load_bundled();
        assert!(
            !registry.vendors.is_empty(),
            "Bundled registry should not be empty"
        );

        let analytics = registry.lookup_domain("google-analytics.com");
        assert!(
            analytics.is_some(),
            "Google Analytics should exist in the standalone executable"
        );
    }
}
