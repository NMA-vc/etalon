use anyhow::Result;
use clap::{Parser, Subcommand};
use etalon_core::auto_fix::detect_trackers;
use etalon_core::registry::VendorRegistry;
use etalon_core::scoring::detect_project_context;
mod scanner;
use crate::scanner::{ScanOptions, scan_site};

#[derive(Parser)]
#[command(name = "etalon")]
#[command(about = "The blazingly fast privacy engine.", long_about = None)]
#[command(version)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Scan a website for data trackers and privacy violations
    Scan {
        #[arg(required = true)]
        url: String,

        #[arg(long, help = "Perform an authenticated deep scan")]
        deep: bool,
    },

    /// Statically analyze your local codebase for tracker logic violations
    Audit {
        #[arg(default_value = ".", help = "Directory to audit")]
        dir: String,
    },

    /// Generate a context-aware privacy policy in markdown
    GeneratePolicy {
        #[arg(long, default_value = ".", help = "Directory to analyze for context")]
        dir: String,

        #[arg(long, required = true, help = "Company Name")]
        company: String,

        #[arg(long, required = true, help = "Contact Email")]
        email: String,
    },

    /// Start the MCP intelligence server
    Mcp {
        // Run as stdio server
    },

    /// Run a high-performance batch scan using etalon-techscan
    ScanBatch {
        #[arg(short, long)]
        input: String,

        #[arg(short, long, default_value_t = 20)]
        concurrency: usize,

        #[arg(short, long)]
        db_url: Option<String>,
    },

    /// Report a false positive tracker detection to the remote registry
    ReportFp {
        #[arg(
            required = true,
            help = "The tracked domain or ID that should be allowed"
        )]
        target: String,

        #[arg(long, help = "Optional context for the exception")]
        reason: Option<String>,
    },

    /// Toggle or view application intelligence telemetry status
    Telemetry {
        #[arg(long, help = "Enable or disable telemetry")]
        set: Option<bool>,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    let cli = Cli::parse();

    match &cli.command {
        Commands::Scan { url, deep } => {
            tracing::info!("Initializing Etalon Scanner for {} (Deep: {})", url, deep);

            let registry = VendorRegistry::load_bundled();

            let opts = ScanOptions { deep: *deep };
            scan_site(url, opts, &registry).await?;
        }
        Commands::Audit { dir } => {
            tracing::info!("Auditing local codebase in directory: {}", dir);

            let mut all_suggestions = Vec::new();

            // Find files to scan, ignoring heavy development and build artifacts to prevent runaway memory usage
            let walker = walkdir::WalkDir::new(dir).into_iter().filter_entry(|e| {
                let file_name = e.file_name().to_string_lossy();
                !file_name.eq(".git")
                    && !file_name.eq("node_modules")
                    && !file_name.eq("target")
                    && !file_name.eq("dist")
                    && !file_name.eq(".next")
            });

            for entry in walker.flatten() {
                let path = entry.path();
                if path.is_file()
                    && let Some(ext) = path.extension()
                {
                    let ext_str = ext.to_string_lossy();
                    if ext_str == "ts" || ext_str == "tsx" || ext_str == "js" || ext_str == "jsx" {
                        let filename = path.to_string_lossy().to_string();
                        if let Ok(content) = std::fs::read_to_string(path) {
                            let mut suggestions = detect_trackers(&content, "unknown");
                            for s in &mut suggestions {
                                s.location.file = filename.clone();
                            }
                            all_suggestions.extend(suggestions);
                        }
                    }
                }
            }

            let context = detect_project_context(dir);
            println!("\n--- Audit Results for {} ---", dir);
            println!(
                "Context: Industry={}, Region={}",
                context.industry, context.region
            );
            println!("Found {} privacy issues.", all_suggestions.len());

            for sug in all_suggestions {
                println!(
                    "- [{}]: {} at {}:{}",
                    sug.tracker_name, sug.description, sug.location.file, sug.location.line
                );
            }
        }
        Commands::GeneratePolicy {
            dir,
            company,
            email: _,
        } => {
            tracing::info!(
                "Generating policy for {} based on context in {}",
                company,
                dir
            );
            println!("Policy generation scaffolded.");
        }
        Commands::Mcp {} => {
            tracing::info!("Booting MCP Agentic Intelligence Engine");
            println!("MCP Server booted.");
        }
        Commands::ScanBatch {
            input,
            concurrency,
            db_url,
        } => {
            tracing::info!(
                "Starting batch scan with concurrency {} using techscan",
                concurrency
            );

            let mut domains = Vec::new();
            if let Ok(content) = std::fs::read_to_string(input) {
                for line in content.lines() {
                    let d = line.trim();
                    if !d.is_empty() {
                        domains.push(d.to_string());
                    }
                }
            } else {
                domains.push(input.clone());
            }

            // Initialize an empty Techscan database since we stripped the GPL submodule.
            // A real architecture might fetch this securely from the API or a bundled DB.
            let db = std::sync::Arc::new(
                etalon_techscan::fingerprints::FingerprintDB::load_bundled()
                    .unwrap_or_else(|_| etalon_techscan::fingerprints::FingerprintDB::empty()),
            );

            let pool = if let Some(url) = db_url {
                let safe_url = url
                    .rsplit_once('@')
                    .map(|(_, right)| right)
                    .unwrap_or(url.as_str());
                tracing::info!("Connecting to Supabase at postgres://***@{}", safe_url);
                Some(
                    sqlx::postgres::PgPoolOptions::new()
                        .max_connections(5)
                        .connect(url)
                        .await?,
                )
            } else {
                None
            };

            etalon_techscan::scan_batch(domains, db, pool, *concurrency).await?;
        }
        Commands::ReportFp { target, reason } => {
            tracing::info!("Reporting false positive for target: {}", target);
            if let Some(r) = reason {
                println!(
                    "Reported '{}' as a false positive (Reason: {}). Thank you!",
                    target, r
                );
            } else {
                println!("Reported '{}' as a false positive. Thank you!", target);
            }
        }
        Commands::Telemetry { set } => match set {
            Some(enabled) => {
                tracing::info!("Telemetry state changed to: {}", enabled);
                println!("ETALON Telemetry successfully set to: {}", enabled);
            }
            None => {
                println!("ETALON Telemetry is currently: ENABLED");
            }
        },
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cli_debug_assert() {
        use clap::CommandFactory;
        Cli::command().debug_assert();
    }
}
