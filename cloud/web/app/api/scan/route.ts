import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import dns from "node:dns/promises";
import ipaddr from "ipaddr.js";

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
            if (bytesRead > 1048576) {
                reader.releaseLock();
                return NextResponse.json({ error: "Payload too large. Max 1MB allowed." }, { status: 413 });
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
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { site_id, url } = body;

    // SSRF Validation
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            return NextResponse.json({ error: "Invalid URL scheme" }, { status: 400 });
        }

        // Immediate string check
        const hostname = parsedUrl.hostname.toLowerCase();
        if (hostname === "localhost" || hostname.endsWith(".local") || hostname === "127.0.0.1" || hostname === "::1") {
            return NextResponse.json({ error: "Private hostnames are not permitted" }, { status: 400 });
        }

        let ipAddresses: string[] = [];
        try {
            const lookupResult = await dns.lookup(hostname, { all: true });
            ipAddresses = lookupResult.map(res => res.address);
        } catch (err) {
            return NextResponse.json({ error: "Hostname resolution failed" }, { status: 400 });
        }

        const isPrivateIp = (ip: string) => {
            try {
                const parsedIp = ipaddr.process(ip);
                const range = parsedIp.range();
                const privateRanges = [
                    "private", "loopback", "linkLocal", "broadcast", "carrierGradeNat",
                    "multicast", "reserved", "uniqueLocal", "localUnicast"
                ];
                return privateRanges.includes(range);
            } catch {
                return true; // fail securely
            }
        };

        for (const ip of ipAddresses) {
            if (isPrivateIp(ip)) {
                return NextResponse.json({ error: "Internal IPs are not permitted" }, { status: 400 });
            }
        }
    } catch {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

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



    // Atomically check quota limit, enqueue scan, and decrement quota using a unified database RPC.
    const { data: enqueueResult, error: enqueueError } = await supabase.rpc("enqueue_atomic_scan", {
        p_user_id: user.id,
        p_site_id: site_id,
        p_url: url
    });

    if (enqueueError) {
        console.error("Atomic enqueue error:", enqueueError);
        return NextResponse.json({ error: "Failed to enqueue scan atomically" }, { status: 500 });
    }

    if (!enqueueResult.success) {
        if (enqueueResult.error_code === "limit_reached") {
            return NextResponse.json(
                { error: `Monthly scan limit reached (${enqueueResult.limit}). Upgrade your plan for more scans.` },
                { status: 429 }
            );
        }
        return NextResponse.json({ error: enqueueResult.message || "Failed to enqueue" }, { status: 500 });
    }

    return NextResponse.json({ scan_id: enqueueResult.scan_id, status: "queued" });
}
