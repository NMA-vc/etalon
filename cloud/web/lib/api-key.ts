import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

/**
 * Create a Supabase client with service role key for API key verification.
 * This bypasses RLS since API key verification happens outside auth context.
 */
function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * Verify an API key and return the associated user ID.
 * Keys are stored as SHA-256 hashes for security.
 */
export async function verifyApiKey(
    apiKey: string
): Promise<{ userId: string | null; keyId: string | null }> {
    const hash = createHash("sha256").update(apiKey).digest("hex");
    const supabase = getServiceClient();

    const { data } = await supabase
        .from("api_keys")
        .select("id, user_id, expires_at")
        .eq("key_hash", hash)
        .single();

    if (!data) {
        return { userId: null, keyId: null };
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { userId: null, keyId: null };
    }

    return { userId: data.user_id, keyId: data.id };
}

/**
 * Update last_used_at for an API key.
 */
export async function touchApiKey(keyId: string): Promise<void> {
    const supabase = getServiceClient();
    await supabase
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", keyId);
}
