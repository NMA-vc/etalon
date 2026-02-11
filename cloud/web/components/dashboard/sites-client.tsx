"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScoreRing } from "@/components/dashboard/score-ring";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SitesClient({ initialSites }: { initialSites: any[] }) {
    const [sites, setSites] = useState(initialSites);
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    async function handleAddSite(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith("http")) normalizedUrl = `https://${normalizedUrl}`;

        const { data, error } = await supabase
            .from("sites")
            .insert({ url: normalizedUrl, name: name.trim() || null, user_id: user.id })
            .select()
            .single();

        setLoading(false);
        if (error) {
            toast.error(error.message);
        } else {
            setSites([data, ...sites]);
            setOpen(false);
            setUrl("");
            setName("");
            toast.success("Site added successfully");
            router.refresh();
        }
    }

    async function handleDeleteSite(id: string) {
        const { error } = await supabase.from("sites").delete().eq("id", id);
        if (error) {
            toast.error(error.message);
        } else {
            setSites(sites.filter((s) => s.id !== id));
            toast.success("Site deleted");
            router.refresh();
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sites</h1>
                    <p className="text-muted-foreground">Manage the sites you monitor</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500">
                            + Add site
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleAddSite}>
                            <DialogHeader>
                                <DialogTitle>Add a new site</DialogTitle>
                                <DialogDescription>Enter the URL of the site you want to monitor.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="site-url">URL</Label>
                                    <Input
                                        id="site-url"
                                        placeholder="https://example.com"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="site-name">Name (optional)</Label>
                                    <Input
                                        id="site-name"
                                        placeholder="My Website"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-emerald-600 to-cyan-600">
                                    {loading ? "Adding..." : "Add site"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {sites.length === 0 ? (
                <Card className="bg-card/50 border-border/40 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-5xl mb-4">🌐</div>
                        <CardTitle className="text-xl mb-2">No sites added yet</CardTitle>
                        <CardDescription className="mb-6 max-w-sm">
                            Add your first site to start monitoring it for trackers and privacy compliance.
                        </CardDescription>
                        <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-emerald-600 to-cyan-600">
                            Add your first site
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sites.map((site: any) => {
                        const latestScan = site.scans?.[0];
                        return (
                            <Card key={site.id} className="bg-card/50 border-border/40 hover:border-emerald-500/30 transition-colors group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <Link href={`/dashboard/sites/${site.id}`}>
                                            <CardTitle className="text-sm font-medium truncate group-hover:text-emerald-400 transition-colors cursor-pointer">
                                                {site.name || new URL(site.url).hostname}
                                            </CardTitle>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                                            onClick={() => handleDeleteSite(site.id)}
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                    <CardDescription className="text-xs truncate">{site.url}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {latestScan?.score != null ? (
                                        <div className="flex items-center gap-3">
                                            <ScoreRing score={latestScan.score} grade={latestScan.grade} size={56} strokeWidth={4} />
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                <p>{latestScan.total_findings} findings</p>
                                                <p>{new Date(latestScan.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="text-xs">Not scanned</Badge>
                                            <Link href={`/dashboard/sites/${site.id}`}>
                                                <Button variant="outline" size="sm" className="text-xs h-7">
                                                    Scan now
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
