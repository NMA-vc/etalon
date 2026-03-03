import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, scans_this_month, scan_limit, display_name, created_at")
        .eq("id", user!.id)
        .single();

    const plan = "open-source";
    const limits = { scans: 99999, price: "Free forever" };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and subscription</p>
            </div>

            <Card className="bg-card/50 border-border/40">
                <CardHeader>
                    <CardTitle className="text-sm">Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium">{user!.email}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Display Name</p>
                            <p className="font-medium">{profile?.display_name || "—"}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Member since</p>
                            <p className="font-medium">{new Date(profile?.created_at || "").toLocaleDateString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/40">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Plan</CardTitle>
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 capitalize">{plan}</Badge>
                    </div>
                    <CardDescription>{limits.price}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Scans this month</span>
                            <span className="font-medium">{profile?.scans_this_month ?? 0} / {limits.scans}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                                style={{ width: `${Math.min(100, ((profile?.scans_this_month ?? 0) / limits.scans) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col items-center gap-3 py-2">
                        <p className="text-sm text-muted-foreground">ETALON is running natively via your hosted infrastructure.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
