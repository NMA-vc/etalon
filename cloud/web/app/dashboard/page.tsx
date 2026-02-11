import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/dashboard/score-ring";
import Link from "next/link";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch sites with latest scan
    const { data: sites } = await supabase
        .from("sites")
        .select("*, scans(id, score, grade, status, created_at, total_findings)")
        .eq("user_id", user!.id)
        .order("created_at", { referencedTable: "scans", ascending: false })
        .limit(1, { referencedTable: "scans" });

    // Fetch recent alerts
    const { data: alerts } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user!.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(5);

    // Fetch recent scans
    const { data: recentScans } = await supabase
        .from("scans")
        .select("*, sites(name, url)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

    // Calculate average score
    const scoredSites = (sites ?? []).filter((s: any) => s.scans?.[0]?.score != null);
    const avgScore = scoredSites.length > 0
        ? Math.round(scoredSites.reduce((sum: number, s: any) => sum + s.scans[0].score, 0) / scoredSites.length)
        : 0;
    const avgGrade = avgScore >= 90 ? "A" : avgScore >= 75 ? "B" : avgScore >= 60 ? "C" : avgScore >= 40 ? "D" : "F";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your privacy compliance</p>
            </div>

            {/* Stats row */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-card/50 border-border/40">
                    <CardHeader className="pb-2">
                        <CardDescription>Average Score</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-4">
                        {scoredSites.length > 0 ? (
                            <ScoreRing score={avgScore} grade={avgGrade} size={100} />
                        ) : (
                            <div className="text-center text-muted-foreground text-sm">
                                <p>No scans yet</p>
                                <p className="text-xs mt-1">Add a site to get started</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/40">
                    <CardHeader className="pb-2">
                        <CardDescription>Sites Monitored</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{sites?.length ?? 0}</div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/40">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Scans</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{recentScans?.length ?? 0}</div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/40">
                    <CardHeader className="pb-2">
                        <CardDescription>Unread Alerts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-400">{alerts?.length ?? 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Sites grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Your Sites</h2>
                    <Link href="/dashboard/sites">
                        <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500">
                            + Add site
                        </Button>
                    </Link>
                </div>

                {(sites?.length ?? 0) === 0 ? (
                    <Card className="bg-card/50 border-border/40 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="text-4xl mb-3">🌐</div>
                            <CardTitle className="text-lg mb-1">No sites yet</CardTitle>
                            <CardDescription className="mb-4">Add your first site to start scanning</CardDescription>
                            <Link href="/dashboard/sites">
                                <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600">
                                    Add your first site
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {(sites ?? []).map((site: any) => {
                            const latestScan = site.scans?.[0];
                            return (
                                <Link key={site.id} href={`/dashboard/sites/${site.id}`}>
                                    <Card className="bg-card/50 border-border/40 hover:border-emerald-500/30 transition-colors cursor-pointer h-full">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm font-medium truncate">{site.name || site.url}</CardTitle>
                                                {latestScan && (
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            latestScan.status === "completed"
                                                                ? "border-emerald-500/30 text-emerald-400"
                                                                : latestScan.status === "failed"
                                                                    ? "border-red-500/30 text-red-400"
                                                                    : "border-yellow-500/30 text-yellow-400"
                                                        }
                                                    >
                                                        {latestScan.status}
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardDescription className="text-xs truncate">{site.url}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {latestScan?.score != null ? (
                                                <div className="flex items-center gap-3">
                                                    <ScoreRing score={latestScan.score} grade={latestScan.grade} size={56} strokeWidth={4} />
                                                    <div className="text-xs text-muted-foreground space-y-1">
                                                        <p>{latestScan.total_findings} findings</p>
                                                        <p>Scanned {new Date(latestScan.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">No scans yet</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Recent alerts */}
            {(alerts?.length ?? 0) > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Recent Alerts</h2>
                        <Link href="/dashboard/alerts">
                            <Button variant="ghost" size="sm">View all</Button>
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {(alerts ?? []).map((alert: any) => (
                            <Card key={alert.id} className="bg-card/50 border-border/40">
                                <CardContent className="flex items-center gap-3 py-3 px-4">
                                    <span className="text-lg">
                                        {alert.type === "new_tracker" ? "🔴" : alert.type === "score_drop" ? "📉" : "❌"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{alert.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {new Date(alert.created_at).toLocaleDateString()}
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
