use etalon_core::registry::VendorRegistry;
use etalon_techscan::fingerprints::FingerprintDB;
use reqwest::Client;
use serde::Deserialize;
use serde_json::{Value, json};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

#[derive(Clone)]
struct ServerContext {
    registry: Arc<VendorRegistry>,
    fingerprints: Arc<FingerprintDB>,
    client: Client,
}

#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct RpcRequest {
    jsonrpc: String,
    id: Option<Value>,
    method: String,
    params: Option<Value>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .with_writer(std::io::stderr) // Crucial: logs must go to stderr so stdin/stdout are clean for JSON-RPC
        .init();

    tracing::info!("Starting ETALON MCP Server...");

    // Initialize databases
    let registry = Arc::new(VendorRegistry::load_bundled());

    let fingerprints = Arc::new(FingerprintDB::load_bundled().unwrap_or_else(|_| {
        tracing::warn!("Could not load fingerprints DB, yielding empty");
        FingerprintDB::empty()
    }));

    let client = Client::new();

    let ctx = ServerContext {
        registry,
        fingerprints,
        client,
    };

    let stdin = tokio::io::stdin();
    let mut reader = BufReader::new(stdin).lines();

    while let Ok(Some(line)) = reader.next_line().await {
        if line.trim().is_empty() {
            continue;
        }

        match serde_json::from_str::<RpcRequest>(&line) {
            Ok(req) => {
                let response = handle_request(&ctx, req).await;
                if let Some(res) = response {
                    let mut stdout = tokio::io::stdout();
                    let out_str = serde_json::to_string(&res)? + "\n";
                    stdout.write_all(out_str.as_bytes()).await?;
                    stdout.flush().await?;
                }
            }
            Err(e) => {
                tracing::error!("Failed to parse JSON-RPC: {}", e);
            }
        }
    }

    Ok(())
}

async fn handle_request(ctx: &ServerContext, req: RpcRequest) -> Option<Value> {
    let id = req.id.clone();

    let result = match req.method.as_str() {
        "initialize" => {
            json!({
                "protocolVersion": "2024-11-05", // MCP Protocol version
                "capabilities": {
                    "tools": {},
                    "resources": {}
                },
                "serverInfo": {
                    "name": "etalon-mcp-server",
                    "version": "1.0.0"
                }
            })
        }
        "notifications/initialized" => {
            tracing::info!("Client successfully initialized MCP connection.");
            return None; // Notifications do not have responses
        }
        "tools/list" => {
            json!({
                "tools": [
                    {
                        "name": "etalon_lookup_vendor",
                        "description": "Check if a domain is a known tracker or vendor",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "domain": {
                                    "type": "string",
                                    "description": "Domain to look up"
                                }
                            },
                            "required": ["domain"]
                        }
                    },
                    {
                        "name": "etalon_search_vendors",
                        "description": "Search the vendor registry by string query",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "Vendor name, company, or ID keywords"
                                }
                            },
                            "required": ["query"]
                        }
                    },
                    {
                        "name": "etalon_get_vendor_info",
                        "description": "Retrieve detailed properties for a specific vendor ID",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "vendor_id": {
                                    "type": "string",
                                    "description": "Specific vendor hardware/software ID"
                                }
                            },
                            "required": ["vendor_id"]
                        }
                    },
                    {
                        "name": "etalon_registry_stats",
                        "description": "Return high-level telemetry and counts of tracking scripts in memory",
                        "inputSchema": {
                            "type": "object",
                            "properties": {}
                        }
                    },
                    {
                        "name": "etalon_scan_domain",
                        "description": "Run the high-speed Techscan fingerprinting engine to detect frameworks and software signatures",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "url": {
                                    "type": "string",
                                    "description": "Full URL starting with https:// to asynchronously scan"
                                }
                            },
                            "required": ["url"]
                        }
                    }
                ]
            })
        }
        "tools/call" => {
            let params = req.params.unwrap_or_default();
            let name = params.get("name").and_then(|v| v.as_str()).unwrap_or("");
            let args = params.get("arguments").cloned().unwrap_or(json!({}));

            let content = match name {
                "etalon_lookup_vendor" => {
                    let domain = args.get("domain").and_then(|v| v.as_str()).unwrap_or("");
                    if let Some(vendor) = ctx.registry.lookup_domain(domain) {
                        format!("Found Tracker: {:?}", vendor)
                    } else {
                        format!("{} is clear or 1st-party.", domain)
                    }
                }
                "etalon_search_vendors" => {
                    let query = args.get("query").and_then(|v| v.as_str()).unwrap_or("");
                    let results = ctx.registry.search(query);
                    format!(
                        "Found {} results for {}: {:?}",
                        results.len(),
                        query,
                        results
                    )
                }
                "etalon_get_vendor_info" => {
                    let vendor_id = args.get("vendor_id").and_then(|v| v.as_str()).unwrap_or("");

                    // VendorRegistry does not have a `get_by_id`, so we find it manually.
                    if let Some(vendor) = ctx.registry.vendors.iter().find(|v| v.id == vendor_id) {
                        format!("Vendor Details: {:?}", vendor)
                    } else {
                        format!("Vendor ID '{}' not found in registry.", vendor_id)
                    }
                }
                "etalon_registry_stats" => {
                    format!("Total Vendors Loaded: {}", ctx.registry.vendors.len())
                }
                "etalon_scan_domain" => {
                    let url = args.get("url").and_then(|v| v.as_str()).unwrap_or("");
                    let res =
                        etalon_techscan::scan_domain(url, &ctx.fingerprints, &ctx.client).await;
                    if let Some(err) = res.error {
                        format!("Failed to run techscan on {}: {:?}", url, err)
                    } else if res.techs.is_empty() {
                        format!("Techscan found NO detectable technologies on {}.", url)
                    } else {
                        let mut out = format!("Techscan results for {}:\n", url);
                        for t in res.techs {
                            out.push_str(&format!("- {} (Confidence: {})\n", t.name, t.confidence));
                        }
                        out
                    }
                }
                _ => format!("Unknown Tool Called: {}", name),
            };

            json!({
                "content": [
                    {
                        "type": "text",
                        "text": content
                    }
                ],
                "isError": false
            })
        }
        "resources/list" => {
            json!({ "resources": [] }) // To be fully implemented like the original TS code next
        }
        "resources/read" => {
            json!({ "contents": [] }) // To be fully implemented
        }
        _ => {
            tracing::warn!("Unhandled MCP Method: {}", req.method);
            return None;
        }
    };

    id.map(|req_id| {
        json!({
            "jsonrpc": "2.0",
            "id": req_id,
            "result": result
        })
    })
}
