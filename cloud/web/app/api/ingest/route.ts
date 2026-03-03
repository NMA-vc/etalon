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
        const supabase = getSupabase();

        // WARN: TRUSTED_PROXY=true enables IP spoofing via x-forwarded-for if not protected by a trusted Edge/WAF.
        // Only enable if ETALON runs strictly behind a trusted reverse proxy (e.g. Cloudflare, Nginx, Traefik).
        const trustedProxy = process.env.TRUSTED_PROXY === "true";
        const ip = (request as any).ip
            ?? (trustedProxy ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0] : null)
            ?? (trustedProxy ? request.headers.get("x-real-ip") : null);

        if (!ip) {
            console.warn("Ingest Route: request.ip is missing and TRUSTED_PROXY is false/missing. Rejecting to prevent global rate limit collapse.");
            return NextResponse.json({ error: "Unable to securely identify request origin" }, { status: 400 });
        }

        const { data: allowed, error: rlError } = await supabase.rpc("check_rate_limit", { client_ip: ip });
        if (rlError || allowed === false) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

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

        // 3. Parse request body with size limits
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Payload too large. Max 5MB allowed." },
                { status: 413 }
            );
        }

        const reader = request.body?.getReader();
        if (!reader) {
            return NextResponse.json({ error: "Missing body" }, { status: 400 });
        }

        let bytesRead = 0;
        const chunks: Uint8Array[] = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                bytesRead += value.length;
                if (bytesRead > 5 * 1024 * 1024) {
                    reader.releaseLock();
                    return NextResponse.json(
                        { error: "Payload too large. Max 5MB allowed." },
                        { status: 413 }
                    );
                }
                chunks.push(value);
            }
        }

        let rawBody = "";
        const decoder = new TextDecoder("utf-8");
        for (const chunk of chunks) {
            rawBody += decoder.decode(chunk, { stream: true });
        }
        rawBody += decoder.decode();

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json(
                { error: "Malformed JSON payload" },
                { status: 400 }
            );
        }

        const { siteId, url, results, cliVersion } = body;

        if (!siteId || !url || !results || typeof results !== 'object' || Array.isArray(results)) {
            return NextResponse.json(
                { error: "Invalid payload schema. Missing required Object fields: siteId, url, results" },
                { status: 400 }
            );
        }

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

        // 5. Extract scores and transact Atomic Limit Check + Insert
        const summary = results.summary || {};
        const score = calculateSimpleScore(results);
        const grade = calculateGrade(score);

        const now = new Date().toISOString();
        const { data: atomicResult, error: atomicError } = await supabase.rpc("ingest_atomic_scan", {
            p_user_id: userId,
            p_site_id: siteId,
            p_url: url,
            p_score: score,
            p_grade: grade,
            p_total_findings: (results.vendors?.length ?? 0) + (results.unknown?.length ?? 0),
            p_critical_count: 0,
            p_high_count: summary.highRisk ?? 0,
            p_medium_count: summary.mediumRisk ?? 0,
            p_low_count: summary.lowRisk ?? 0,
            p_trackers_found: results.vendors?.map((v: any) => ({
                id: v.vendor?.id,
                name: v.vendor?.name,
                category: v.vendor?.category,
                risk_score: v.vendor?.risk_score,
                domains: v.requests?.map((r: any) => r.domain).filter(Boolean),
            })) ?? [],
            p_unknown_domains: results.unknown?.map((u: any) => ({
                domain: u.domain,
                suggestedAction: u.suggestedAction,
                requestCount: u.requests?.length ?? 0,
            })) ?? [],
            p_cli_version: cliVersion ?? null,
            p_duration_ms: results.meta?.scanDurationMs ?? null,
            p_started_at: results.meta?.scanDate ?? now,
            p_completed_at: now
        });

        if (atomicError) {
            console.error("Ingest atomic error:", atomicError);
            return NextResponse.json({ error: "Failed to save scan results atomically" }, { status: 500 });
        }

        if (!atomicResult.success) {
            if (atomicResult.error_code === "limit_reached") {
                return NextResponse.json(
                    { error: `Monthly scan limit reached (${atomicResult.limit}). Upgrade your plan for more scans.` },
                    { status: 429 }
                );
            }
            return NextResponse.json({ error: "Atomic operation failed" }, { status: 500 });
        }

        const scanId = atomicResult.scan_id;

        // 10. Return success
        return NextResponse.json({
            success: true,
            scanId: scanId,
            score,
            grade,
            dashboardUrl: `https://etalon.nma.vc/dashboard/scans/${scanId}`,
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
