import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreRing } from "@/components/dashboard/score-ring";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: scan } = await supabase
        .from("scans")
        .select("*, sites(name, url)")
        .eq("id", id)
        .single();

    if (!scan) notFound();

    const trackers = (scan.trackers_found as any[]) || [];
    const unknowns = (scan.unknown_domains as any[]) || [];
    const findings = (scan.full_report as any)?.findings || [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href={`/dashboard/sites/${scan.site_id}`} className="text-muted-foreground hover:text-foreground text-sm">
                            ← {(scan as any).sites?.name || "Site"}
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Scan Results</h1>
                    <p className="text-muted-foreground text-sm">{scan.url} · {new Date(scan.created_at).toLocaleString()}</p>
                </div>
                <Badge
                    variant="outline"
                    className={
                        scan.status === "completed"
                            ? "border-emerald-500/30 text-emerald-400"
                            : scan.status === "failed"
                                ? "border-red-500/30 text-red-400"
                                : "border-yellow-500/30 text-yellow-400"
                    }
                >
                    {scan.status}
                </Badge>
            </div>

            {scan.status === "completed" && scan.score != null && (
                <>
                    {/* Score card */}
                    <div className="grid gap-4 md:grid-cols-6">
                        <Card className="bg-card/50 border-border/40 md:col-span-2">
                            <CardContent className="flex items-center justify-center py-8">
                                <ScoreRing score={scan.score} grade={scan.grade} size={140} strokeWidth={10} />
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50 border-border/40 md:col-span-4">
                            <CardHeader>
                                <CardTitle className="text-sm">Findings Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 gap-4 text-center">
                                    {[
                                        { label: "Critical", count: scan.critical_count, color: "bg-red-500" },
                                        { label: "High", count: scan.high_count, color: "bg-orange-500" },
                                        { label: "Medium", count: scan.medium_count, color: "bg-yellow-500" },
                                        { label: "Low", count: scan.low_count, color: "bg-blue-500" },
                                        { label: "Total", count: scan.total_findings, color: "bg-zinc-500" },
                                    ].map((s) => (
                                        <div key={s.label} className="space-y-2">
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${s.color}`}
                                                    style={{ width: `${scan.total_findings ? (s.count / scan.total_findings) * 100 : 0}%` }}
                                                />
                                            </div>
                                            <p className="text-2xl font-bold">{s.count}</p>
                                            <p className="text-xs text-muted-foreground">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                {scan.duration_ms && (
                                    <p className="text-xs text-muted-foreground mt-4">
                                        Completed in {(scan.duration_ms / 1000).toFixed(1)}s
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Trackers */}
                    {trackers.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Trackers Found ({trackers.length})</h2>
                            <Card className="bg-card/50 border-border/40">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Vendor</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Domain</TableHead>
                                            <TableHead>Risk</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trackers.map((t: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{t.name || t.vendor_id}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">{t.category}</Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{t.domain}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            (t.risk_score ?? 5) >= 7 ? "border-red-500/30 text-red-400"
                                                                : (t.risk_score ?? 5) >= 4 ? "border-yellow-500/30 text-yellow-400"
                                                                    : "border-emerald-500/30 text-emerald-400"
                                                        }
                                                    >
                                                        {(t.risk_score ?? 5) >= 7 ? "High" : (t.risk_score ?? 5) >= 4 ? "Medium" : "Low"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )}

                    {/* Findings */}
                    {findings.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">All Findings ({findings.length})</h2>
                            <Card className="bg-card/50 border-border/40">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Severity</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>File</TableHead>
                                            <TableHead>Rule</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {findings.slice(0, 50).map((f: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            f.severity === "critical" ? "border-red-500/30 text-red-400"
                                                                : f.severity === "high" ? "border-orange-500/30 text-orange-400"
                                                                    : f.severity === "medium" ? "border-yellow-500/30 text-yellow-400"
                                                                        : "border-blue-500/30 text-blue-400"
                                                        }
                                                    >
                                                        {f.severity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium text-sm">{f.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-md">{f.message}</p>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs font-mono">
                                                    {f.file}{f.line ? `:${f.line}` : ""}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{f.rule}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )}
                </>
            )}

            {scan.status === "failed" && scan.error && (
                <Card className="bg-card/50 border-red-500/20">
                    <CardContent className="py-6">
                        <p className="text-red-400 text-sm">{scan.error}</p>
                    </CardContent>
                </Card>
            )}

            {(scan.status === "queued" || scan.status === "running") && (
                <Card className="bg-card/50 border-border/40">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-12 w-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
                        <CardTitle className="text-lg mb-1">
                            {scan.status === "queued" ? "Scan queued" : "Scan in progress"}
                        </CardTitle>
                        <CardDescription>This page will update when the scan completes</CardDescription>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
