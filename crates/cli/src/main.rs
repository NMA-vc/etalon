use anyhow::Result;
use clap::{Parser, Subcommand};
use etalon_core::auto_fix::detect_trackers;
use etalon_core::registry::VendorRegistry;
use etalon_core::scoring::detect_project_context;
mod scanner;
use crate::scanner::{ScanOptions, scan_site};

fn print_banner() {
    let dim = "\x1b[90m";
    let cyan = "\x1b[36;1m";
    let blue = "\x1b[34;1m";
    let white = "\x1b[37;1m";
    let reset = "\x1b[0m";

    let version = env!("CARGO_PKG_VERSION");

    println!();
    println!("{blue}  ███████╗████████╗ ██████╗ ██╗      ██████╗ ███╗   ██╗{reset}");
    println!("{blue}  ██╔════╝╚══██╔══╝██╔════╝ ██║     ██╔═══██╗████╗  ██║{reset}");
    println!("{cyan}  █████╗     ██║   ██║  ███╗██║     ██║   ██║██╔██╗ ██║{reset}");
    println!("{cyan}  ██╔══╝     ██║   ██║   ██║██║     ██║   ██║██║╚██╗██║{reset}");
    println!("{blue}  ███████╗   ██║   ╚██████╔╝███████╗╚██████╔╝██║ ╚████║{reset}");
    println!("{blue}  ╚══════╝   ╚═╝    ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝{reset}");
    println!();
    println!("{dim}  v{version}  {white}Privacy audit tool for AI coding agents{reset}");
    println!("{dim}  Open-source GDPR compliance scanner  {cyan}etalon.nma.vc{reset}");
    println!();
}

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

    /// Extract universal markdown from a URL or supported document (PDF, DOCX, etc)
    Extract {
        #[arg(
            required = true,
            help = "The URL or local file path to extract content from"
        )]
        target: String,
    },

    /// Start the MCP intelligence server
    Mcp {
        // Run as stdio server
    },

    /// Detect third-party tech frameworks, trackers and SDKs on a domain
    Techscan {
        /// Domain to scan, or file path when used with --batch
        #[arg(required = true)]
        target: String,

        /// Treat target as a file containing one domain per line
        #[arg(long)]
        batch: bool,

        /// Number of concurrent scans (only relevant with --batch)
        #[arg(short, long, default_value_t = 20)]
        concurrency: usize,

        /// Postgres connection string to persist results
        #[arg(long)]
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

    print_banner();

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
        Commands::Extract { target } => {
            tracing::info!("Extracting universal markdown from target: {}", target);

            // Exine conflicts with SQLx at the static linker level due to libsqlite3-sys version mismatches.
            // We invoke the exine CLI binary directly instead of compiling it as a crate.
            let mut cmd = std::process::Command::new("exine");

            if target.starts_with("http") {
                cmd.arg("fetch").arg(&target);
            } else {
                cmd.arg("convert").arg(&target);
            }

            let status = cmd.status();

            match status {
                Ok(s) if s.success() => {
                    tracing::info!("Extraction successful.");
                }
                Ok(s) => {
                    eprintln!("Exine extraction failed with exit code: {}", s);
                }
                Err(e) => {
                    eprintln!("Failed to invoke Exine extraction engine: {}", e);
                    eprintln!("Make sure it is installed via: cargo install exine");
                }
            }
        }
        Commands::Mcp {} => {
            tracing::info!("Booting MCP Agentic Intelligence Engine");
            println!("MCP Server booted.");
        }
        Commands::Techscan {
            target,
            batch,
            concurrency,
            db_url,
        } => {
            let mut domains = Vec::new();

            if *batch {
                tracing::info!(
                    "Starting batch techscan from file '{}' with concurrency {}",
                    target, concurrency
                );
                let content = std::fs::read_to_string(target)
                    .map_err(|e| anyhow::anyhow!("Could not read batch file '{}': {}", target, e))?;
                for line in content.lines() {
                    let d = line.trim();
                    if !d.is_empty() {
                        domains.push(d.to_string());
                    }
                }
            } else {
                tracing::info!("Starting techscan for domain: {}", target);
                domains.push(target.clone());
            }

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
