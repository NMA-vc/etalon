use anyhow::Result;
use chromiumoxide::browser::{Browser, BrowserConfig};
use chromiumoxide::cdp::browser_protocol::network::EventRequestWillBeSent;
use etalon_core::domain_utils::{extract_domain, is_first_party};
use etalon_core::registry::VendorRegistry;
use futures::StreamExt;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone)]
pub struct CapturedRequest {
    pub domain: String,
}

pub struct ScanOptions {
    pub deep: bool,
}

pub async fn scan_site(url: &str, options: ScanOptions, registry: &VendorRegistry) -> Result<()> {
    let start_time = std::time::Instant::now();
    tracing::info!("Starting scan for {} (deep={})", url, options.deep);
    let site_domain = extract_domain(url).unwrap_or_else(|| url.to_string());

    // Launch headless browser
    let (mut browser, mut handler) = Browser::launch(
        BrowserConfig::builder()
            .arg("--disable-cache")
            .arg("--incognito")
            .arg("--disable-application-cache")
            .arg("--disable-offline-load-stale-cache")
            .arg("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
            .build()
            .map_err(|e| anyhow::anyhow!(e))?,
    )
    .await?;

    // Spawn handler
    let browser_handle = tokio::spawn(async move {
        while let Some(h) = handler.next().await {
            if h.is_err() {
                break;
            }
        }
    });

    let page = browser.new_page(url).await?;

    // Capture requests
    let captured_requests = Arc::new(Mutex::new(Vec::new()));
    let requests_clone = captured_requests.clone();

    let mut request_events = page.event_listener::<EventRequestWillBeSent>().await?;

    tokio::spawn(async move {
        while let Some(event) = request_events.next().await {
            if let Some(domain) = extract_domain(&event.request.url) {
                let req = CapturedRequest { domain };
                requests_clone.lock().await.push(req);
            }
        }
    });

    // Wait for the page to load or timeout
    let _ = page.wait_for_navigation().await;

    // The key missing piece from Node.js is waiting for network-idle, 
    // where trackers fire *after* the DOM loads. 
    tracing::info!("Waiting for data aggregators and trackers to fire beacons...");

    if options.deep {
        tracing::info!("Deep scanning mode: Scrolling...");
        // Basic deep scan scroll simulation
        for _ in 0..5 {
            let _ = page
                .evaluate("window.scrollBy(0, window.innerHeight);")
                .await;
            tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
        }
    } else {
        // Hard wait to allow React/Vue/GTM to bootstrap and fire their analytics
        tokio::time::sleep(tokio::time::Duration::from_millis(5000)).await;
    }

    // Capture requests via Performance API, which catches cross-origin iframe requests
    // and tracker beacons that Chromiumoxide's main-frame event listener misses.
    let js_resources = match page
        .evaluate("Array.from(window.performance.getEntries()).map(e => e.name)")
        .await
    {
        Ok(v) => v.into_value::<Vec<String>>().unwrap_or_default(),
        Err(e) => {
            tracing::warn!("Failed to extract Performance Timing resources: {}", e);
            vec![]
        }
    };
    
    let duration = start_time.elapsed();

    browser.close().await?;
    let _ = browser_handle.await;

    // Process requests
    let mut reqs = captured_requests.lock().await.clone();
    
    for res_url in js_resources {
        if let Some(domain) = extract_domain(&res_url) {
            reqs.push(CapturedRequest { domain });
        }
    }
    let mut third_party_reqs = Vec::new();
    let mut domain_counts: std::collections::HashMap<String, usize> = std::collections::HashMap::new();

    for req in reqs.iter() {
        if !is_first_party(&req.domain, &site_domain) {
            third_party_reqs.push(req.clone());
            *domain_counts.entry(req.domain.clone()).or_insert(0) += 1;
        }
    }

    struct OutputItem {
        domain: String,
        count: usize,
        vendor: Option<etalon_core::types::Vendor>,
    }

    let mut items = Vec::new();
    let mut known_vendors = 0;

    for (domain, count) in domain_counts {
        let vendor = registry.lookup_domain(&domain).cloned();
        if vendor.is_some() {
            known_vendors += 1;
        }
        items.push(OutputItem {
            domain,
            count,
            vendor,
        });
    }

    let mut high_risk = Vec::new();
    let mut medium_risk = Vec::new();
    let mut low_risk = Vec::new();

    for item in items {
        if let Some(v) = &item.vendor {
            if v.risk_score >= 6 {
                high_risk.push(item);
            } else if v.risk_score >= 3 {
                medium_risk.push(item);
            } else {
                low_risk.push(item);
            }
        } else {
            low_risk.push(item); // Unknown defaults to low risk to match legacy behavior
        }
    }

    let dim = "\x1b[90m";
    let cyan = "\x1b[36;1m";
    let red_bold = "\x1b[31;1m";
    let yellow_bold = "\x1b[33;1m";
    let green_bold = "\x1b[32;1m";
    let reset = "\x1b[0m";

    println!("\n\n{}ETALON Privacy Audit{}", cyan, reset);
    println!("{}═══════════════════════════════════════════════════════{}", dim, reset);
    println!("{dim}Site:{reset}       {}", url);
    let now = chrono::Local::now();
    println!("{dim}Scanned:{reset}    {}", now.format("%-d.%-m.%Y, %H:%M:%S"));
    println!("{dim}Duration:{reset}   {:.1} seconds", duration.as_secs_f32());
    println!();

    println!("📊 Summary");
    println!("{}───────────────────────────────────────────────────────{}", dim, reset);
    println!("✓ {} third-party requests", third_party_reqs.len());
    println!("✓ {} matched to known vendors", known_vendors);
    if !high_risk.is_empty() {
        println!("✗ {} high-risk tracker detected", high_risk.len());
    } else {
        println!("✓ 0 high-risk trackers detected");
    }
    println!();

    if !high_risk.is_empty() {
        println!("{}🔴 High Risk ({}){}", red_bold, high_risk.len(), reset);
        println!("{}───────────────────────────────────────────────────────{}", dim, reset);
        for item in high_risk {
            let v = item.vendor.unwrap();
            println!("{:<35} {}", item.domain, v.name);
            println!("{}├─ Category:{reset}   {}", dim, v.category);
            let gdpr_str = if v.gdpr_compliant { "Compliant" } else { "Non-compliant" };
            println!("{}├─ GDPR:{reset}       {}", dim, gdpr_str);
            if let Some(data) = v.data_collected {
                println!("{}├─ Data:{reset}       {}", dim, data.join(", "));
            }
            if let Some(dpa) = v.dpa_url {
                println!("{}├─ DPA:{reset}        {}", dim, dpa);
            }
            if let Some(alts) = v.alternatives {
                println!("{}├─ Alt:{reset}        {}", dim, alts.join(", "));
            }
            println!("{}└─ Requests:{reset}   {}\n", dim, item.count);
        }
    }

    if !medium_risk.is_empty() {
        println!("{}🟡 Medium Risk ({}){}", yellow_bold, medium_risk.len(), reset);
        println!("{}───────────────────────────────────────────────────────{}", dim, reset);
        for item in medium_risk {
            let v = item.vendor.unwrap();
            println!("{:<35} {}", item.domain, v.name);
            println!("{}├─ Category:{reset}   {}", dim, v.category);
            let gdpr_str = if v.gdpr_compliant { "Compliant (with DPA)" } else { "Non-compliant" };
            println!("{}├─ GDPR:{reset}       {}", dim, gdpr_str);
            if let Some(data) = v.data_collected {
                println!("{}├─ Data:{reset}       {}", dim, data.join(", "));
            }
            if let Some(dpa) = v.dpa_url {
                println!("{}├─ DPA:{reset}        {}", dim, dpa);
            }
            if let Some(alts) = v.alternatives {
                println!("{}├─ Alt:{reset}        {}", dim, alts.join(", "));
            }
            println!("{}└─ Requests:{reset}   {}\n", dim, item.count);
        }
    }

    if !low_risk.is_empty() {
        println!("{}🟢 Low Risk ({}){}", green_bold, low_risk.len(), reset);
        println!("{}───────────────────────────────────────────────────────{}", dim, reset);
        for item in low_risk {
            if let Some(v) = item.vendor {
                println!("{:<35} {}", item.domain, v.name);
                println!("{}├─ Category:{reset}   {}", dim, v.category);
            } else {
                println!("{:<35} {}", item.domain, "Unknown Tracker");
            }
            println!("{}└─ Requests:{reset}   {}\n", dim, item.count);
        }
    }

    println!("💡 Recommendations");
    println!("{}───────────────────────────────────────────────────────{}", dim, reset);
    println!("Run with --format json for machine-readable output");
    println!("Report issues: github.com/NMA-vc/etalon/issues\n");

    Ok(())
}
