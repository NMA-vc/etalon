use futures::StreamExt;
use hickory_resolver::TokioAsyncResolver;
use reqwest::Url;
use reqwest::header::HeaderMap;
use std::collections::HashMap;
use std::net::IpAddr;

pub struct Signals {
    pub headers: HashMap<String, String>,
    pub cookies: Vec<String>, // cookie names
    pub html: String,
    pub script_srcs: Vec<String>,
    pub meta_tags: HashMap<String, String>,
}

pub async fn fetch_signals(_client: &reqwest::Client, url: &str) -> anyhow::Result<Signals> {
    // SSRF TOCTOU mitigation: resolve the IP first and check it
    let parsed_url = Url::parse(url)?;
    let host = parsed_url
        .host_str()
        .ok_or_else(|| anyhow::anyhow!("Invalid URL host"))?;

    let resolver = TokioAsyncResolver::tokio_from_system_conf()?;
    let response_resolver = resolver.lookup_ip(host).await?;

    // We bind the first valid public IP
    let mut resolved_ip = None;

    for ip in response_resolver.iter() {
        if is_internal_ip(&ip) {
            anyhow::bail!(
                "SSRF Protection: Resolved IP {} is routed to an internal network segment",
                ip
            );
        }
        if resolved_ip.is_none() {
            resolved_ip = Some(ip);
        }
    }

    let socket_ip =
        resolved_ip.ok_or_else(|| anyhow::anyhow!("No valid public IPs resolved for host"))?;

    // Create an isolated reqwest client bound strictly to the validated IP Address.
    // This eradicates TOCTOU DNS Rebinding organically.
    let parsed_port = parsed_url.port_or_known_default().unwrap_or(80);
    let socket_addr = std::net::SocketAddr::new(socket_ip, parsed_port);

    // Build a secure isolated client overriding DNS locally
    let secure_client = reqwest::Client::builder()
        .resolve(host, socket_addr)
        .redirect(reqwest::redirect::Policy::none())
        .build()?;

    // HEAD first — cheap header check using bound client
    let head = secure_client.head(url).send().await?;
    let headers = extract_headers(head.headers());
    let cookies = extract_cookie_names(&headers);

    let response = secure_client.get(url).send().await?;
    let mut response_stream = response.bytes_stream();
    let mut raw_bytes = Vec::new();

    // 5MB Limit cap for high-concurrency buffers
    const MAX_BODY_SIZE: usize = 5 * 1024 * 1024;
    while let Some(chunk) = response_stream.next().await {
        let chunk = chunk?;
        if raw_bytes.len() + chunk.len() > MAX_BODY_SIZE {
            tracing::warn!("Response body exceeded 5MB max, truncating stream buffer.");
            break;
        }
        raw_bytes.extend_from_slice(&chunk);
    }
    let html = String::from_utf8_lossy(&raw_bytes).into_owned();

    let document = scraper::Html::parse_document(&html);
    let script_srcs = extract_script_srcs(&document);
    let meta_tags = extract_meta_tags(&document);

    Ok(Signals {
        headers,
        cookies,
        html,
        script_srcs,
        meta_tags,
    })
}

fn is_internal_ip(ip: &IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => {
            ipv4.is_private()
            || ipv4.is_loopback()
            || ipv4.is_link_local()
            || ipv4.is_broadcast()
            || ipv4.is_documentation()
            || ipv4.octets()[0] == 100 && (ipv4.octets()[1] & 0b1100_0000 == 0b0100_0000) // Carrier grade NAT 100.64.0.0/10
            || ipv4.octets()[0] == 198 && (ipv4.octets()[1] & 0b1111_1110 == 18) // 198.18.0.0/15
        }
        IpAddr::V6(ipv6) => {
            ipv6.is_loopback()
            || ipv6.segments()[0] & 0xff00 == 0xff00 // Multicast
            || ipv6.segments()[0] & 0xfe80 == 0xfe80 // Link-local
            || ipv6.segments()[0] & 0xfc00 == 0xfc00 // Unique local
        }
    }
}

fn extract_headers(headers: &HeaderMap) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for (k, v) in headers.iter() {
        if let Ok(v_str) = v.to_str() {
            map.insert(k.as_str().to_lowercase(), v_str.to_string());
        }
    }
    map
}

fn extract_cookie_names(headers: &HashMap<String, String>) -> Vec<String> {
    let mut names = Vec::new();
    if let Some(cookie_str) = headers.get("set-cookie") {
        for part in cookie_str.split(';') {
            if let Some((name, _)) = part.split_once('=') {
                names.push(name.trim().to_string());
            }
        }
    }
    names
}

fn extract_script_srcs(document: &scraper::Html) -> Vec<String> {
    let mut srcs = Vec::new();
    let selector = scraper::Selector::parse("script[src]").unwrap();
    for element in document.select(&selector) {
        if let Some(src) = element.value().attr("src") {
            srcs.push(src.to_string());
        }
    }
    srcs
}

fn extract_meta_tags(document: &scraper::Html) -> HashMap<String, String> {
    let mut map = HashMap::new();
    let selector = scraper::Selector::parse("meta[name][content]").unwrap();
    for element in document.select(&selector) {
        if let (Some(name), Some(content)) = (
            element.value().attr("name"),
            element.value().attr("content"),
        ) {
            map.insert(name.to_lowercase(), content.to_string());
        }
    }
    map
}
