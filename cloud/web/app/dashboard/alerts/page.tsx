import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AlertsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: alerts } = await supabase
        .from("alerts")
        .select("id, site_id, title, message, read, type, created_at, sites(name, url)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

    // Action intentionally removed. Mark as Read should be triggered actively by the user via a POST/PUT endpoint, not implicitly loaded on GET.

    const typeIcons: Record<string, string> = {
        new_tracker: "🔴",
        score_drop: "📉",
        scan_failed: "❌",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
                <p className="text-muted-foreground">Notifications about your monitored sites</p>
            </div>

            {(alerts?.length ?? 0) === 0 ? (
                <Card className="bg-card/50 border-border/40 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-5xl mb-4">🔔</div>
                        <CardTitle className="text-xl mb-2">No alerts</CardTitle>
                        <CardDescription>You&apos;re all good! We&apos;ll notify you when something changes.</CardDescription>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {(alerts ?? []).map((alert: any) => (
                        <Card key={alert.id} className={`bg-card/50 border-border/40 ${!alert.read ? "border-l-2 border-l-emerald-500" : ""}`}>
                            <CardContent className="flex items-start gap-4 py-4 px-5">
                                <span className="text-xl mt-0.5">{typeIcons[alert.type] || "🔔"}</span>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">{alert.title}</p>
                                        {!alert.read && <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px]">New</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                                    {(alert as any).sites && (
                                        <Link href={`/dashboard/sites/${alert.site_id}`} className="text-xs text-emerald-400 hover:underline">
                                            {(alert as any).sites.name || (alert as any).sites.url}
                                        </Link>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {new Date(alert.created_at).toLocaleDateString()}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
