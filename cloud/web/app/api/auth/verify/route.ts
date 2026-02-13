import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-key";

/**
 * POST /api/auth/verify
 * Verify an API key is valid. Used by the CLI `etalon auth login` command.
 */
export async function POST(request: NextRequest) {
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
