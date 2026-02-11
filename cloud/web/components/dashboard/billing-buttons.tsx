"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function UpgradeButton({ plan }: { plan: "cloud" | "pro" }) {
    const [loading, setLoading] = useState(false);

    async function handleUpgrade() {
        setLoading(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Failed to start checkout");
                return;
            }
            window.location.href = data.url;
        } catch {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    const label = plan === "cloud" ? "Upgrade to Cloud — €29/mo" : "Upgrade to Pro — €99/mo";

    return (
        <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90"
        >
            {loading ? "Redirecting..." : label}
        </Button>
    );
}

export function ManageBillingButton() {
    const [loading, setLoading] = useState(false);

    async function handleManage() {
        setLoading(true);
        try {
            const res = await fetch("/api/stripe/portal", { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Failed to open billing portal");
                return;
            }
            window.location.href = data.url;
        } catch {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button onClick={handleManage} disabled={loading} variant="outline">
            {loading ? "Opening..." : "Manage billing"}
        </Button>
    );
}
