import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key";

import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/auth/verify
 * Verify an API key is valid. Used by the CLI `etalon auth login` command.
 */
export async function POST(request: NextRequest) {
    // WARN: TRUSTED_PROXY=true enables IP spoofing via x-forwarded-for if not protected by a trusted Edge/WAF.
    // Only enable if ETALON runs strictly behind a trusted reverse proxy (e.g. Cloudflare, Nginx, Traefik).
    const trustedProxy = process.env.TRUSTED_PROXY === "true";
    const ip = (request as any).ip
        ?? (trustedProxy ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0] : null)
        ?? (trustedProxy ? request.headers.get("x-real-ip") : null);

    if (!ip) {
        console.warn("API Key Verification: request.ip is missing and TRUSTED_PROXY is false/missing. Rejecting to prevent global rate limit collapse.");
        return NextResponse.json({ error: "Unable to securely identify request origin" }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: allowed, error } = await supabase.rpc("check_rate_limit", { client_ip: ip });
    if (error || allowed === false) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    const apiKey = authHeader.substring(7);
    const { userId } = await verifyApiKey(apiKey);

    if (userId) {
        return NextResponse.json({ valid: true });
    } else {
        return NextResponse.json({ valid: false }, { status: 401 });
    }
}
