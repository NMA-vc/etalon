import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyApiKey, touchApiKey } from "@/lib/api-key";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * GET /api/sites
 * List sites for the authenticated API key user.
 * Used by `etalon sites` CLI command.
 */
export async function GET(request: NextRequest) {
    // WARN: TRUSTED_PROXY=true enables IP spoofing via x-forwarded-for if not protected by a trusted Edge/WAF.
    // Only enable if ETALON runs strictly behind a trusted reverse proxy (e.g. Cloudflare, Nginx, Traefik).
    const trustedProxy = process.env.TRUSTED_PROXY === "true";
    const ip = (request as any).ip
        ?? (trustedProxy ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0] : null)
        ?? (trustedProxy ? request.headers.get("x-real-ip") : null);

    if (!ip) {
        console.warn("Sites Route: request.ip is missing and TRUSTED_PROXY is false/missing. Rejecting to prevent global rate limit collapse.");
        return NextResponse.json({ error: "Unable to securely identify request origin" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: allowed, error: rlError } = await supabase.rpc("check_rate_limit", { client_ip: ip });
    if (rlError || allowed === false) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const apiKey = authHeader.substring(7);
    const { userId, keyId } = await verifyApiKey(apiKey);

    if (!userId || !keyId) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    await touchApiKey(keyId);

    const { data: sites, error } = await supabase
        .from("sites")
        .select("id, name, url, slug, last_scanned_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sites: sites ?? [] });
}
