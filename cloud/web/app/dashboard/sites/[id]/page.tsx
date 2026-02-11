import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreRing } from "@/components/dashboard/score-ring";
import Link from "next/link";
import { ScanTrigger } from "@/components/dashboard/scan-trigger";

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: site } = await supabase
        .from("sites")
        .select("*")
        .eq("id", id)
        .single();

    if (!site) notFound();

    const { data: scans } = await supabase
        .from("scans")
        .select("*")
        .eq("site_id", id)
        .order("created_at", { ascending: false })
        .limit(20);

    const latestScan = scans?.[0];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{site.name || new URL(site.url).hostname}</h1>
                    <p className="text-muted-foreground text-sm">{site.url}</p>
                </div>
                <ScanTrigger siteId={site.id} siteUrl={site.url} />
            </div>

            {/* Score overview */}
            {latestScan?.score != null && (
                <div className="grid gap-4 md:grid-cols-5">
                    <Card className="bg-card/50 border-border/40 md:col-span-1">
                        <CardContent className="flex items-center justify-center py-6">
                            <ScoreRing score={latestScan.score} grade={latestScan.grade} />
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/40 md:col-span-4">
                        <CardHeader>
                            <CardTitle className="text-sm">Latest Scan</CardTitle>
                            <CardDescription>{new Date(latestScan.created_at).toLocaleString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-4 text-center">
                                {[
                                    { label: "Critical", count: latestScan.critical_count, color: "text-red-400" },
                                    { label: "High", count: latestScan.high_count, color: "text-orange-400" },
                                    { label: "Medium", count: latestScan.medium_count, color: "text-yellow-400" },
                                    { label: "Low", count: latestScan.low_count, color: "text-blue-400" },
                                    { label: "Total", count: latestScan.total_findings, color: "text-foreground" },
                                ].map((s) => (
                                    <div key={s.label}>
                                        <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                                        <p className="text-xs text-muted-foreground">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Scan history */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Scan History</h2>
                {(scans?.length ?? 0) === 0 ? (
                    <Card className="bg-card/50 border-border/40 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="text-4xl mb-3">📊</div>
                            <CardTitle className="text-lg mb-1">No scans yet</CardTitle>
                            <CardDescription>Trigger your first scan to see results here</CardDescription>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-card/50 border-border/40">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Findings</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(scans ?? []).map((scan: any) => (
                                    <TableRow key={scan.id}>
                                        <TableCell className="text-sm">
                                            {new Date(scan.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    scan.status === "completed"
                                                        ? "border-emerald-500/30 text-emerald-400"
                                                        : scan.status === "failed"
                                                            ? "border-red-500/30 text-red-400"
                                                            : scan.status === "running"
                                                                ? "border-blue-500/30 text-blue-400"
                                                                : "border-yellow-500/30 text-yellow-400"
                                                }
                                            >
                                                {scan.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {scan.score != null ? (
                                                <span className="font-medium">{scan.grade} ({scan.score})</span>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                        <TableCell>{scan.total_findings ?? "—"}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {scan.duration_ms ? `${(scan.duration_ms / 1000).toFixed(1)}s` : "—"}
                                        </TableCell>
                                        <TableCell>
                                            {scan.status === "completed" && (
                                                <Link href={`/dashboard/scans/${scan.id}`}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </div>
        </div>
    );
}
