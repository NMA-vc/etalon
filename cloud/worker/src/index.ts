import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { runScan } from './scan-runner.js';
import { generateAlerts } from './alert-generator.js';
import { checkScheduledScans } from './scheduler.js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10);
const CONCURRENCY = parseInt(process.env.MAX_CONCURRENCY || '2', 10);

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
let activeScanCount = 0;

console.log(`
╔══════════════════════════════════════╗
║   ETALON Scan Worker                  ║
║   Polling every ${String(POLL_INTERVAL_MS).padEnd(5)}ms            ║
║   Max concurrency: ${CONCURRENCY}                ║
╚══════════════════════════════════════╝
`);

async function pollForScans() {
    if (activeScanCount >= CONCURRENCY) return;

    const slotsAvailable = CONCURRENCY - activeScanCount;

    // Atomically claim queued scans
    const { data: scans, error } = await supabase
        .from('scans')
        .select('*')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(slotsAvailable);

    if (error) {
        console.error('[poll] Error fetching scans:', error.message);
        return;
    }

    if (!scans || scans.length === 0) return;

    console.log(`[poll] Found ${scans.length} queued scan(s)`);

    for (const scan of scans) {
        // Mark as running — optimistic lock via .eq('status', 'queued')
        const { error: updateError, count } = await supabase
            .from('scans')
            .update({ status: 'running', started_at: new Date().toISOString() })
            .eq('id', scan.id)
            .eq('status', 'queued'); // Only succeeds if still queued

        if (updateError) {
            console.error(`[scan:${scan.id}] Failed to claim:`, updateError.message);
            continue;
        }

        // If another worker already claimed this scan, skip it
        if (count === 0) {
            console.log(`[scan:${scan.id}] Already claimed by another worker, skipping`);
            continue;
        }

        activeScanCount++;
        processScan(supabase, scan).finally(() => {
            activeScanCount--;
        });
    }
}

async function processScan(supabase: SupabaseClient, scan: { id: string; url: string; user_id: string; site_id: string }) {
    const scanId = scan.id;
    console.log(`[scan:${scanId}] Starting scan of ${scan.url}`);
    const startTime = Date.now();

    try {
        const result = await runScan(scan.url);
        const durationMs = Date.now() - startTime;

        console.log(`[scan:${scanId}] Completed in ${(durationMs / 1000).toFixed(1)}s — Score: ${result.score} (${result.grade})`);

        // Write results
        const { error } = await supabase
            .from('scans')
            .update({
                status: 'completed',
                score: result.score,
                grade: result.grade,
                total_findings: result.totalFindings,
                critical_count: result.criticalCount,
                high_count: result.highCount,
                medium_count: result.mediumCount,
                low_count: result.lowCount,
                trackers_found: result.trackers,
                unknown_domains: result.unknownDomains,
                full_report: result.fullReport,
                duration_ms: durationMs,
                completed_at: new Date().toISOString(),
            })
            .eq('id', scanId);

        if (error) {
            console.error(`[scan:${scanId}] Failed to write results:`, error.message);
            return;
        }

        // Generate alerts
        await generateAlerts(supabase, scan, result);

        // Increment scan count for the user
        await supabase.rpc('increment_scan_count', { uid: scan.user_id });

    } catch (err: unknown) {
        const durationMs = Date.now() - startTime;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[scan:${scanId}] Failed after ${(durationMs / 1000).toFixed(1)}s:`, errMsg);

        await supabase
            .from('scans')
            .update({
                status: 'failed',
                error: errMsg.slice(0, 500),
                duration_ms: durationMs,
                completed_at: new Date().toISOString(),
            })
            .eq('id', scanId);
    }
}

// Main loop
const CRON_INTERVAL_MS = 5 * 60 * 1000; // Check scheduled scans every 5 minutes
let lastCronCheck = 0;

async function main() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            await pollForScans();

            // Run cron check periodically
            const now = Date.now();
            if (now - lastCronCheck >= CRON_INTERVAL_MS) {
                lastCronCheck = now;
                await checkScheduledScans(supabase);
            }
        } catch (err: unknown) {
            console.error('[main] Poll error:', err instanceof Error ? err.message : String(err));
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
}

main();
