import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ScansPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: scans } = await supabase
        .from("scans")
        .select("*, sites(name, url)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Scans</h1>
                <p className="text-muted-foreground">History of all your privacy scans</p>
            </div>

            {(scans?.length ?? 0) === 0 ? (
                <Card className="bg-card/50 border-border/40 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-5xl mb-4">📊</div>
                        <CardTitle className="text-xl mb-2">No scans yet</CardTitle>
                        <CardDescription className="mb-4">Add a site and run your first scan</CardDescription>
                        <Link href="/dashboard/sites">
                            <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600">Go to sites</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-card/50 border-border/40">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Site</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Findings</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(scans ?? []).map((scan: any) => (
                                <TableRow key={scan.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-sm">{scan.sites?.name || new URL(scan.url).hostname}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-xs">{scan.url}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                scan.status === "completed" ? "border-emerald-500/30 text-emerald-400"
                                                    : scan.status === "failed" ? "border-red-500/30 text-red-400"
                                                        : scan.status === "running" ? "border-blue-500/30 text-blue-400"
                                                            : "border-yellow-500/30 text-yellow-400"
                                            }
                                        >
                                            {scan.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {scan.score != null ? (
                                            <span className="font-medium">{scan.grade} ({scan.score})</span>
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell>{scan.total_findings ?? "—"}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(scan.created_at).toLocaleDateString()}
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
    );
}
