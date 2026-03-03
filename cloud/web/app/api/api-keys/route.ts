import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const { name } = body;
    if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate key
    const rawKey = `etalon_${randomBytes(32).toString("hex")}`;
    const prefix = rawKey.slice(0, 12);
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const { data: apiKey, error } = await supabase
        .from("api_keys")
        .insert({ user_id: user.id, name, key_hash: keyHash, prefix })
        .select("id, name, prefix, created_at")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the raw key once — it will never be retrievable again
    return NextResponse.json({ key: rawKey, api_key: apiKey });
}
