import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UpgradeButton, ManageBillingButton } from "@/components/dashboard/billing-buttons";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();

    const planLimits: Record<string, { scans: number; price: string }> = {
        free: { scans: 10, price: "Free" },
        cloud: { scans: 100, price: "€29/mo" },
        pro: { scans: 1000, price: "€99/mo" },
        enterprise: { scans: 99999, price: "Custom" },
    };

    const plan = profile?.plan || "free";
    const limits = planLimits[plan] || planLimits.free;
    const hasBilling = !!profile?.stripe_customer_id;

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

                    {plan === "free" ? (
                        <div className="flex flex-col items-center gap-3 py-2">
                            <p className="text-sm text-muted-foreground">Upgrade for hosted scanning, email alerts, and more</p>
                            <div className="flex gap-3">
                                <UpgradeButton plan="cloud" />
                                <UpgradeButton plan="pro" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between py-2">
                            <p className="text-sm text-muted-foreground">
                                {plan === "cloud" ? "Want more? Upgrade to Pro for 1,000 scans/mo" : "You're on our most powerful plan"}
                            </p>
                            <div className="flex gap-3">
                                {plan === "cloud" && <UpgradeButton plan="pro" />}
                                {hasBilling && <ManageBillingButton />}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
