"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ApiKeysClient({ initialKeys }: { initialKeys: any[] }) {
    const [keys, setKeys] = useState(initialKeys);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const router = useRouter();

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const res = await fetch("/api/api-keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            toast.error(data.error || "Failed to create key");
        } else {
            setNewKey(data.key);
            setKeys([data.api_key, ...keys]);
            setName("");
            toast.success("API key created");
            router.refresh();
        }
    }

    async function handleDelete(id: string) {
        const supabase = createClient();
        const { error } = await supabase.from("api_keys").delete().eq("id", id);
        if (error) {
            toast.error(error.message);
        } else {
            setKeys(keys.filter((k) => k.id !== id));
            toast.success("API key deleted");
        }
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
                    <p className="text-muted-foreground">Manage keys for programmatic access</p>
                </div>
                <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setNewKey(null); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600">+ Create key</Button>
                    </DialogTrigger>
                    <DialogContent>
                        {newKey ? (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Your API key</DialogTitle>
                                    <DialogDescription>Copy this key now — you won&apos;t be able to see it again.</DialogDescription>
                                </DialogHeader>
                                <div className="p-3 rounded-lg bg-zinc-900 border border-border/40 font-mono text-sm break-all select-all">
                                    {newKey}
                                </div>
                                <DialogFooter>
                                    <Button onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copied!"); }}>
                                        Copy to clipboard
                                    </Button>
                                    <Button variant="outline" onClick={() => { setOpen(false); setNewKey(null); }}>Done</Button>
                                </DialogFooter>
                            </>
                        ) : (
                            <form onSubmit={handleCreate}>
                                <DialogHeader>
                                    <DialogTitle>Create API key</DialogTitle>
                                    <DialogDescription>Give your key a descriptive name.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-2">
                                    <Label htmlFor="key-name">Name</Label>
                                    <Input id="key-name" placeholder="My CI/CD key" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={loading} className="bg-gradient-to-r from-emerald-600 to-cyan-600">
                                        {loading ? "Creating..." : "Create key"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {keys.length === 0 ? (
                <Card className="bg-card/50 border-border/40 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-5xl mb-4">🔑</div>
                        <CardTitle className="text-xl mb-2">No API keys</CardTitle>
                        <CardDescription>Create a key to use the ETALON API programmatically.</CardDescription>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-card/50 border-border/40">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Key</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Last Used</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {keys.map((k: any) => (
                                <TableRow key={k.id}>
                                    <TableCell className="font-medium">{k.name}</TableCell>
                                    <TableCell className="font-mono text-muted-foreground">{k.prefix}•••••••</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{new Date(k.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(k.id)}>
                                            Delete
                                        </Button>
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
