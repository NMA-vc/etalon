import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyApiKey, touchApiKey } from "@/lib/api-key";

/**
 * Service role client for ingesting scan results (no auth context).
 */
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * POST /api/ingest
 *
 * Receive scan results from the CLI.
 * Requires a valid API key in the Authorization header.
 *
 * Body: { siteId, url, results, cliVersion }
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Verify API Key
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Missing API key. Run: etalon auth login" },
                { status: 401 }
            );
        }

        const apiKey = authHeader.substring(7);
        const { userId, keyId } = await verifyApiKey(apiKey);

        if (!userId || !keyId) {
            return NextResponse.json(
                { error: "Invalid or expired API key" },
                { status: 401 }
            );
        }

        // 2. Touch API key last_used_at
        await touchApiKey(keyId);

        // 3. Parse request body
        const body = await request.json();
        const { siteId, url, results, cliVersion } = body;

        if (!siteId || !url || !results) {
            return NextResponse.json(
                { error: "Missing required fields: siteId, url, results" },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        // 4. Verify site belongs to this user
        const { data: site } = await supabase
            .from("sites")
            .select("id, slug")
            .eq("id", siteId)
            .eq("user_id", userId)
            .single();

        if (!site) {
            return NextResponse.json(
                { error: "Site not found or not owned by you" },
                { status: 404 }
            );
        }

        // 5. Check usage limits
        const { data: profile } = await supabase
            .from("profiles")
            .select("scans_this_month, scan_limit")
            .eq("id", userId)
            .single();

        if (profile && profile.scans_this_month >= profile.scan_limit) {
            return NextResponse.json(
                {
                    error: `Monthly scan limit reached (${profile.scan_limit}). Upgrade your plan for more scans.`,
                },
                { status: 429 }
            );
        }

        // 6. Extract score/grade/counts from the ScanReport
        const summary = results.summary || {};
        const score = calculateSimpleScore(results);
        const grade = calculateGrade(score);

        // 7. Insert scan record
        const now = new Date().toISOString();
        const { data: scan, error: scanError } = await supabase
            .from("scans")
            .insert({
                site_id: siteId,
                user_id: userId,
                url,
                status: "completed",
                score,
                grade,
                total_findings: (results.vendors?.length ?? 0) + (results.unknown?.length ?? 0),
                critical_count: summary.highRisk ?? 0,
                high_count: 0,
                medium_count: summary.mediumRisk ?? 0,
                low_count: summary.lowRisk ?? 0,
                trackers_found: results.vendors?.map((v: any) => ({
                    id: v.vendor?.id,
                    name: v.vendor?.name,
                    category: v.vendor?.category,
                    risk_score: v.vendor?.risk_score,
                    domains: v.requests?.map((r: any) => r.domain).filter(Boolean),
                })) ?? [],
                unknown_domains: results.unknown?.map((u: any) => ({
                    domain: u.domain,
                    suggestedAction: u.suggestedAction,
                    requestCount: u.requests?.length ?? 0,
                })) ?? [],
                full_report: results,
                duration_ms: results.meta?.scanDurationMs ?? null,
                triggered_by: "cli",
                cli_version: cliVersion ?? null,
                started_at: results.meta?.scanDate ?? now,
                completed_at: now,
            })
            .select("id")
            .single();

        if (scanError) {
            console.error("Ingest scan insert error:", scanError);
            return NextResponse.json(
                { error: "Failed to save scan results" },
                { status: 500 }
            );
        }

        // 8. Increment scan count
        await supabase.rpc("increment_scan_count", { uid: userId });

        // 9. Update site's last_scanned_at
        await supabase
            .from("sites")
            .update({ last_scanned_at: now })
            .eq("id", siteId);

        // 10. Return success
        return NextResponse.json({
            success: true,
            scanId: scan.id,
            score,
            grade,
            dashboardUrl: `https://etalon.nma.vc/dashboard/scans/${scan.id}`,
        });
    } catch (error) {
        console.error("Ingest error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Simple scoring: 100 minus penalties for risky vendors.
 */
function calculateSimpleScore(results: any): number {
    let score = 100;
    const vendors = results.vendors ?? [];
    const unknown = results.unknown ?? [];

    for (const v of vendors) {
        const risk = v.vendor?.risk_score ?? 5;
        if (risk >= 8) score -= 15;
        else if (risk >= 6) score -= 10;
        else if (risk >= 4) score -= 5;
        else score -= 2;
    }

    // Unknown domains are suspicious
    score -= unknown.length * 3;

    return Math.max(0, Math.min(100, score));
}

/**
 * Grade from score.
 */
function calculateGrade(score: number): string {
    if (score >= 90) return "A";
    if (score >= 75) return "B";
    if (score >= 60) return "C";
    if (score >= 40) return "D";
    return "F";
}
