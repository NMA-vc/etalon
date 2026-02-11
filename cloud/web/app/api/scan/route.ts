import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { site_id, url } = body;

    if (!site_id || !url) {
        return NextResponse.json({ error: "site_id and url are required" }, { status: 400 });
    }

    // Verify site belongs to user
    const { data: site } = await supabase
        .from("sites")
        .select("id")
        .eq("id", site_id)
        .eq("user_id", user.id)
        .single();

    if (!site) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Check usage limits
    const { data: profile } = await supabase
        .from("profiles")
        .select("scans_this_month, scan_limit")
        .eq("id", user.id)
        .single();

    if (profile && profile.scans_this_month >= profile.scan_limit) {
        return NextResponse.json(
            { error: `Monthly scan limit reached (${profile.scan_limit}). Upgrade your plan for more scans.` },
            { status: 429 }
        );
    }

    // Create scan record (queued)
    const { data: scan, error } = await supabase
        .from("scans")
        .insert({
            site_id,
            user_id: user.id,
            url,
            status: "queued",
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Note: scan count is incremented by the worker on successful completion
    // to avoid double-counting.

    return NextResponse.json({ scan_id: scan.id, status: "queued" });
}
