import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
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
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the raw key once — it will never be retrievable again
    return NextResponse.json({ key: rawKey, api_key: apiKey });
}
