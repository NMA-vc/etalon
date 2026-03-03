# API Reference

Use ETALON programmatically in your Rust applications.

## etalon-core

The core crate provides vendor matching, scoring, and registry access.

### Cargo.toml

```toml
[dependencies]
etalon-core = "0.9"
```

### Vendor Lookup

```rust
use etalon_core::VendorRegistry;

let registry = VendorRegistry::load()?;

// Look up a domain
if let Some(vendor) = registry.lookup_domain("analytics.google.com") {
    println!("Vendor: {}", vendor.name);
    println!("Category: {}", vendor.category);
    println!("Risk: {}", vendor.risk_score);
    println!("GDPR: {}", vendor.gdpr_compliant);
}

// Search vendors
let results = registry.search("facebook");
for vendor in results {
    println!("{} — {} domains", vendor.name, vendor.domains.len());
}
```

### Score Calculation

```rust
use etalon_core::{calculate_score, Finding};

let findings: Vec<Finding> = vec![/* ... */];
let (score, grade) = calculate_score(&findings);
println!("Score: {}/100 ({})", score, grade);
```

## etalon-techscan

The techscan crate provides async technology fingerprinting.

### Cargo.toml

```toml
[dependencies]
etalon-techscan = "0.9"
```

### Code Audit

```rust
use etalon_techscan::audit_project;

let report = audit_project("./src").await?;
for finding in &report.findings {
    println!("[{}] {} — {}", finding.severity, finding.rule_id, finding.message);
}
```
