import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/sites/[id]
 * Update site settings (public toggle, name, etc.)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: site } = await supabase
        .from("sites")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (!site) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 1048576) {
        return NextResponse.json({ error: "Payload too large. Max 1MB allowed." }, { status: 413 });
    }
    const rawBody = await request.text();
    if (rawBody.length > 1048576) {
        return NextResponse.json({ error: "Payload too large. Max 1MB allowed." }, { status: 413 });
    }

    let body;
    try {
        body = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Only allow specific fields to be updated
    const allowedFields = ["name", "public", "schedule"] as const;
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
        if (field in body) {
            updates[field] = body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { error } = await supabase
        .from("sites")
        .update(updates)
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
