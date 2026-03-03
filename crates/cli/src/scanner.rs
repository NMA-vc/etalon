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
    tracing::info!("Starting scan for {} (deep={})", url, options.deep);
    let site_domain = extract_domain(url).unwrap_or_else(|| url.to_string());

    // Launch headless browser
    let (mut browser, mut handler) = Browser::launch(
        BrowserConfig::builder()
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
    page.wait_for_navigation().await?;

    if options.deep {
        tracing::info!("Deep scanning mode: Scrolling...");
        // Basic deep scan scroll simulation
        for _ in 0..5 {
            let _ = page
                .evaluate("window.scrollBy(0, window.innerHeight);")
                .await;
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        }
    } else {
        tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
    }

    browser.close().await?;
    let _ = browser_handle.await;

    // Process requests
    let reqs = captured_requests.lock().await;
    let mut third_party_reqs = Vec::new();

    for req in reqs.iter() {
        if !is_first_party(&req.domain, &site_domain) {
            third_party_reqs.push(req.clone());
        }
    }

    tracing::info!(
        "Captured {} total requests, {} third-party",
        reqs.len(),
        third_party_reqs.len()
    );

    let mut known_vendors = 0;
    let mut unknown_domains = 0;

    for req in third_party_reqs {
        if let Some(vendor) = registry.lookup_domain(&req.domain) {
            tracing::info!(
                "Detected Vendor: {} ({}) via {}",
                vendor.name,
                vendor.category,
                req.domain
            );
            known_vendors += 1;
        } else {
            tracing::debug!("Unknown third-party: {}", req.domain);
            unknown_domains += 1;
        }
    }

    println!("\n--- Scan Results ---");
    println!("Target: {}", url);
    println!("Third-party requests: {}", known_vendors + unknown_domains);
    println!("Identified Vendors: {}", known_vendors);
    println!("Unknown Trackers: {}", unknown_domains);

    Ok(())
}
