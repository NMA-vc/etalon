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

    const supabase = getSupabase();

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
