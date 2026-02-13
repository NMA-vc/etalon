import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Schedule definitions and their intervals in milliseconds.
 */
const SCHEDULE_INTERVALS: Record<string, number> = {
    'hourly': 60 * 60 * 1000,
    'daily': 24 * 60 * 60 * 1000,
    'weekly': 7 * 24 * 60 * 60 * 1000,
    'monthly': 30 * 24 * 60 * 60 * 1000,
};

/**
 * Check for sites with scheduled scans that are due and queue them.
 *
 * A scan is "due" if:
 * - The site's schedule is not 'manual'
 * - The site hasn't been scanned within the schedule interval
 * - There's no queued or running scan for the site already
 */
export async function checkScheduledScans(supabase: SupabaseClient): Promise<void> {
    // Get all sites with a non-manual schedule
    const { data: sites, error } = await supabase
        .from('sites')
        .select('id, url, user_id, schedule, last_scanned_at')
        .not('schedule', 'eq', 'manual')
        .not('schedule', 'is', null);

    if (error) {
        console.error('[cron] Error fetching scheduled sites:', error.message);
        return;
    }

    if (!sites || sites.length === 0) return;

    const now = Date.now();
    let queuedCount = 0;

    for (const site of sites) {
        const interval = SCHEDULE_INTERVALS[site.schedule];
        if (!interval) continue; // Unknown schedule type

        // Check if scan is due
        const lastScan = site.last_scanned_at ? new Date(site.last_scanned_at).getTime() : 0;
        const timeSinceLastScan = now - lastScan;

        if (timeSinceLastScan < interval) continue; // Not yet due

        // Check for existing queued/running scans to avoid duplicates
        const { data: existing } = await supabase
            .from('scans')
            .select('id')
            .eq('site_id', site.id)
            .in('status', ['queued', 'running'])
            .limit(1);

        if (existing && existing.length > 0) continue; // Already has pending scan

        // Queue a new scan
        const { error: insertError } = await supabase
            .from('scans')
            .insert({
                site_id: site.id,
                user_id: site.user_id,
                url: site.url,
                status: 'queued',
                triggered_by: 'schedule',
            });

        if (insertError) {
            console.error(`[cron] Failed to queue scan for ${site.url}:`, insertError.message);
        } else {
            queuedCount++;
            console.log(`[cron] Queued scheduled scan for ${site.url} (${site.schedule})`);
        }
    }

    if (queuedCount > 0) {
        console.log(`[cron] Queued ${queuedCount} scheduled scan(s)`);
    }
}
