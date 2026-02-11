"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ScanTrigger({ siteId, siteUrl }: { siteId: string; siteUrl: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleScan() {
        setLoading(true);
        try {
            const res = await fetch("/api/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ site_id: siteId, url: siteUrl }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Scan failed");
            toast.success("Scan queued successfully");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            onClick={handleScan}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
        >
            {loading ? "Queuing..." : "🔍 Scan now"}
        </Button>
    );
}
