import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScanResult } from './scan-runner.js';
import { sendEmail, newTrackerEmail, scoreDropEmail } from './email.js';

const APP_URL = process.env.APP_URL || 'https://etalon.nma.vc';

interface ScanRecord {
    id: string;
    user_id: string;
    site_id: string;
    url: string;
}

interface AlertRecord {
    user_id: string;
    site_id: string;
    scan_id: string;
    type: string;
    title: string;
    message: string;
    tracker_data?: unknown;
}

export async function generateAlerts(
    supabase: SupabaseClient,
    scan: ScanRecord,
    result: ScanResult
) {
    const alerts: AlertRecord[] = [];

    // Check for non-GDPR-compliant trackers
    const nonCompliant = result.trackers.filter(t => !t.gdpr_compliant);
    if (nonCompliant.length > 0) {
        alerts.push({
            user_id: scan.user_id,
            site_id: scan.site_id,
            scan_id: scan.id,
            type: 'new_tracker',
            title: `${nonCompliant.length} non-GDPR-compliant tracker(s) found`,
            message: `Detected: ${nonCompliant.map(t => t.name).join(', ')}. These trackers require explicit user consent under GDPR.`,
            tracker_data: nonCompliant,
        });
    }

    // Check for high-risk trackers (risk >= 7)
    const highRisk = result.trackers.filter(t => t.risk_score >= 7);
    if (highRisk.length > 0 && nonCompliant.length === 0) {
        // Only alert if we haven't already alerted on non-compliance
        alerts.push({
            user_id: scan.user_id,
            site_id: scan.site_id,
            scan_id: scan.id,
            type: 'new_tracker',
            title: `${highRisk.length} high-risk tracker(s) detected`,
            message: `High-risk trackers found: ${highRisk.map(t => t.name).join(', ')}. Review immediately.`,
            tracker_data: highRisk,
        });
    }

    // Check if score dropped compared to previous scan
    const { data: previousScans } = await supabase
        .from('scans')
        .select('score')
        .eq('site_id', scan.site_id)
        .eq('status', 'completed')
        .neq('id', scan.id)
        .order('created_at', { ascending: false })
        .limit(1);

    if (previousScans && previousScans.length > 0 && previousScans[0].score != null) {
        const prevScore = previousScans[0].score;
        const scoreDrop = prevScore - result.score;
        if (scoreDrop >= 10) {
            alerts.push({
                user_id: scan.user_id,
                site_id: scan.site_id,
                scan_id: scan.id,
                type: 'score_drop',
                title: `Compliance score dropped by ${scoreDrop} points`,
                message: `Score went from ${prevScore} to ${result.score} (${result.grade}). New trackers or configuration changes may be the cause.`,
            });
        }
    }

    // Check for unknown domains
    if (result.unknownDomains.length >= 5) {
        alerts.push({
            user_id: scan.user_id,
            site_id: scan.site_id,
            scan_id: scan.id,
            type: 'new_tracker',
            title: `${result.unknownDomains.length} unknown domains detected`,
            message: `Found ${result.unknownDomains.length} unrecognized third-party domains. These may be untracked trackers: ${result.unknownDomains.slice(0, 5).map(d => d.domain).join(', ')}${result.unknownDomains.length > 5 ? '...' : ''}`,
        });
    }

    // Insert alerts
    if (alerts.length > 0) {
        const { error } = await supabase.from('alerts').insert(alerts);
        if (error) {
            console.error(`[alerts] Failed to create ${alerts.length} alert(s):`, error.message);
        } else {
            console.log(`[alerts] Created ${alerts.length} alert(s) for scan ${scan.id}`);
        }

        // Send email alerts
        const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', scan.user_id)
            .single();

        if (profile?.email) {
            // Get site name
            const { data: site } = await supabase
                .from('sites')
                .select('name, url')
                .eq('id', scan.site_id)
                .single();
            const siteName = site?.name || site?.url || scan.url;
            const scanUrl = `${APP_URL}/dashboard/scans/${scan.id}`;

            // Send tracker alert email
            const nonCompliant = result.trackers.filter(t => !t.gdpr_compliant);
            if (nonCompliant.length > 0) {
                const email = newTrackerEmail(siteName, nonCompliant.map(t => t.name), scanUrl);
                email.to = profile.email;
                await sendEmail(email);
            }

            // Send score drop email
            const prevScan = alerts.find((a) => a.type === 'score_drop');
            if (prevScan) {
                // Extract previous score from the alert message
                const match = prevScan.message?.match(/from (\d+) to/);
                const oldScore = match ? parseInt(match[1]) : result.score + 10;
                const email = scoreDropEmail(siteName, oldScore, result.score, result.grade, scanUrl);
                email.to = profile.email;
                await sendEmail(email);
            }
        }
    }
}
