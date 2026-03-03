use anyhow::Result;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::mpsc;

use crate::dns;
use crate::enricher;
use crate::fetcher::fetch_signals;
use crate::fingerprints::FingerprintDB;
use crate::matcher;
use crate::types::ScanResult;
use futures::StreamExt;

const TIMEOUT_SECS: u64 = 10;
const CHANNEL_SIZE: usize = 1024;

pub async fn scan_batch(
    domains: Vec<String>,
    db: Arc<FingerprintDB>,
    pool: Option<PgPool>,
    concurrency: usize,
) -> Result<()> {
    let concurrency_limit = concurrency.clamp(1, 100);
    let client = build_client()?;
    let (tx, rx) = mpsc::channel::<ScanResult>(CHANNEL_SIZE);

    let writer = tokio::spawn(writer_task(rx, pool.clone()));

    let total = domains.len();
    let counter = Arc::new(std::sync::atomic::AtomicUsize::new(0));

    let stream = futures::stream::iter(domains.into_iter().map(|domain| {
        let (db, client, tx, counter) = (db.clone(), client.clone(), tx.clone(), counter.clone());

        async move {
            let result = scan_domain(&domain, &db, &client).await;
            let done = counter.fetch_add(1, std::sync::atomic::Ordering::Relaxed) + 1;
            if done % 1000 == 0 || done == total {
                tracing::info!("{}/{} domains scanned", done, total);
            }
            let _ = tx.send(result).await;
        }
    }));

    // Buffer unordered streams dynamically capping active task limit without unbounded vectors
    stream
        .buffer_unordered(concurrency_limit)
        .for_each(|_| async {})
        .await;

    drop(tx);
    writer.await??;
    Ok(())
}

fn build_client() -> Result<reqwest::Client> {
    Ok(reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(TIMEOUT_SECS))
        .pool_max_idle_per_host(10)
        .user_agent("Mozilla/5.0 (compatible; ETALON/1.0)")
        .redirect(reqwest::redirect::Policy::none())
        .build()?)
}

pub async fn scan_domain(domain: &str, db: &FingerprintDB, client: &reqwest::Client) -> ScanResult {
    let start = std::time::Instant::now();
    let url = if domain.starts_with("http") {
        domain.to_string()
    } else {
        format!("https://{}", domain)
    };

    let (fetch_result, dns_result) =
        tokio::join!(fetch_signals(client, &url), dns::lookup(domain),);

    match fetch_result {
        Err(e) => ScanResult {
            domain: domain.to_string(),
            techs: vec![],
            scanned_at: chrono::Utc::now(),
            scan_ms: start.elapsed().as_millis() as u64,
            error: Some(e.to_string()),
        },
        Ok(signals) => {
            let mut techs = matcher::match_all(&signals, db);
            techs.extend(dns_result.unwrap_or_default());
            techs = enricher::resolve_implies(techs, db);

            ScanResult {
                domain: domain.to_string(),
                techs,
                scanned_at: chrono::Utc::now(),
                scan_ms: start.elapsed().as_millis() as u64,
                error: None,
            }
        }
    }
}

async fn writer_task(mut rx: mpsc::Receiver<ScanResult>, pool: Option<PgPool>) -> Result<()> {
    while let Some(res) = rx.recv().await {
        if let Some(ref p) = pool {
            if !res.techs.is_empty() {
                let mut domains = Vec::with_capacity(res.techs.len());
                let mut tech_names = Vec::with_capacity(res.techs.len());
                let mut categories = Vec::with_capacity(res.techs.len());
                let mut confidences = Vec::with_capacity(res.techs.len());
                let mut versions = Vec::with_capacity(res.techs.len());
                let mut vias = Vec::with_capacity(res.techs.len());
                let mut scanned_ats = Vec::with_capacity(res.techs.len());
                let mut scan_mss = Vec::with_capacity(res.techs.len());

                for tech in &res.techs {
                    let via_str = match &tech.via {
                        crate::types::DetectionMethod::Header(s) => format!("Header({})", s),
                        crate::types::DetectionMethod::Cookie(s) => format!("Cookie({})", s),
                        crate::types::DetectionMethod::Html => "Html".to_string(),
                        crate::types::DetectionMethod::ScriptSrc => "ScriptSrc".to_string(),
                        crate::types::DetectionMethod::Meta => "Meta".to_string(),
                        crate::types::DetectionMethod::Dns => "Dns".to_string(),
                        crate::types::DetectionMethod::Implied(s) => format!("Implied({})", s),
                    };

                    let cats: Vec<i32> = tech.categories.iter().map(|&c| c as i32).collect();
                    let stringified_cats =
                        serde_json::to_value(cats).unwrap_or(serde_json::json!([]));

                    domains.push(res.domain.clone());
                    tech_names.push(tech.name.clone());
                    categories.push(stringified_cats);
                    confidences.push(tech.confidence as i16);
                    versions.push(tech.version.clone());
                    vias.push(via_str);
                    scanned_ats.push(res.scanned_at);
                    scan_mss.push(res.scan_ms as i32);
                }

                if let Err(e) = sqlx::query(
                    "INSERT INTO tech_detections (domain, tech_name, categories, confidence, version, via, scanned_at, scan_ms) \
                     SELECT * FROM UNNEST($1::text[], $2::text[], $3::jsonb[], $4::smallint[], $5::text[], $6::text[], $7::timestamptz[], $8::integer[])"
                )
                .bind(&domains)
                .bind(&tech_names)
                .bind(&categories) // Using JSONB array mapping since postgres cant handle native 2d array easily in unnest
                .bind(&confidences)
                .bind(&versions)
                .bind(&vias)
                .bind(&scanned_ats)
                .bind(&scan_mss)
                .execute(p)
                .await {
                    tracing::error!("Failed to bulk insert {} techscan results for {}: {}", res.techs.len(), res.domain, e);
                } else {
                    tracing::info!(
                        "Saved bulk {} techs for {} to DB",
                        res.techs.len(),
                        res.domain
                    );
                }
            }
        } else if res.error.is_none() {
            println!(
                "✅ Scanned {}: {} techs found in {}ms",
                res.domain,
                res.techs.len(),
                res.scan_ms
            );
        } else {
            println!("❌ Failed {}: {:?}", res.domain, res.error);
        }
    }
    Ok(())
}
