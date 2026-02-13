import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { TrustHero } from "@/components/trust/trust-hero";
import { TrustVendorGrid } from "@/components/trust/trust-vendor-grid";
import { TrustTimeline } from "@/components/trust/trust-timeline";
import { TrustRequestForm } from "@/components/trust/trust-request-form";
import { Shield } from "lucide-react";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: site } = await supabase
        .from("sites")
        .select("name, url")
        .eq("slug", slug)
        .eq("public", true)
        .single();

    if (!site) {
        return { title: "Trust Center Not Found | ETALON" };
    }

    const siteName = site.name || new URL(site.url).hostname;

    return {
        title: `${siteName} — Privacy & Compliance | ETALON Trust Center`,
        description: `View ${siteName}'s privacy compliance status, third-party vendors, and scan history. Verified by ETALON.`,
        openGraph: {
            title: `${siteName} Privacy Trust Center`,
            description: `Independently verified privacy compliance for ${siteName}`,
        },
    };
}

export default async function TrustCenterPage({ params }: PageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    // 1. Get site by slug (only if public)
    const { data: site } = await supabase
        .from("sites")
        .select("id, name, url, slug, public")
        .eq("slug", slug)
        .eq("public", true)
        .single();

    if (!site) {
        notFound();
    }

    const siteName = site.name || new URL(site.url).hostname;

    // 2. Get latest completed scan
    const { data: latestScan } = await supabase
        .from("scans")
        .select("id, score, grade, trackers_found, unknown_domains, completed_at, duration_ms, total_findings")
        .eq("site_id", site.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

    // 3. Get recent scans for timeline
    const { data: recentScans } = await supabase
        .from("scans")
        .select("id, completed_at, score, grade")
        .eq("site_id", site.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(12);

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/logo.png"
                            alt="ETALON"
                            width={36}
                            height={36}
                            className="rounded"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold tracking-tight">ETALON</span>
                            <span className="text-muted-foreground text-sm">Trust Center</span>
                        </div>
                    </Link>
                    <Link
                        href="https://etalon.nma.vc"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Powered by ETALON
                    </Link>
                </div>
            </nav>

            {/* Main */}
            <main className="mx-auto max-w-5xl px-6 py-12 space-y-16">
                {/* Hero */}
                <TrustHero
                    siteName={siteName}
                    siteUrl={site.url}
                    score={latestScan?.score ?? null}
                    grade={latestScan?.grade ?? null}
                    lastVerified={latestScan?.completed_at ?? null}
                />

                {/* Scan Timeline */}
                {recentScans && recentScans.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Verification History
                        </h2>
                        <TrustTimeline scans={recentScans} />
                    </section>
                )}

                {/* Vendors */}
                {latestScan?.trackers_found && (latestScan.trackers_found as any[]).length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold mb-6">
                            Third-Party Services ({(latestScan.trackers_found as any[]).length})
                        </h2>
                        <TrustVendorGrid vendors={latestScan.trackers_found as any[]} />
                    </section>
                )}

                {/* Unknown domains note */}
                {latestScan?.unknown_domains && (latestScan.unknown_domains as any[]).length > 0 && (
                    <section className="rounded-xl border border-border/60 bg-card/50 p-6">
                        <h3 className="font-semibold text-sm mb-2 text-muted-foreground">
                            Unclassified Domains ({(latestScan.unknown_domains as any[]).length})
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {(latestScan.unknown_domains as any[]).length} third-party domain(s) were detected but could not be
                            automatically classified. These are under review.
                        </p>
                    </section>
                )}

                {/* No scans */}
                {!latestScan && (
                    <div className="rounded-xl border border-dashed border-border bg-card/30 p-12 text-center">
                        <div className="text-4xl mb-4">📊</div>
                        <h2 className="text-xl font-semibold mb-2">No scans yet</h2>
                        <p className="text-muted-foreground">
                            This site hasn&apos;t been scanned yet. Check back soon.
                        </p>
                    </div>
                )}

                {/* Request Access */}
                <TrustRequestForm siteSlug={slug} />
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 mt-20">
                <div className="mx-auto max-w-5xl px-6 py-8 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                        This Trust Center is automatically generated and continuously updated by{" "}
                        <Link href="https://etalon.nma.vc" className="text-primary hover:underline">
                            ETALON
                        </Link>
                        .
                    </p>
                    {latestScan?.completed_at && (
                        <p className="text-xs text-muted-foreground/60">
                            Last scan: {new Date(latestScan.completed_at).toLocaleString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    )}
                </div>
            </footer>
        </div>
    );
}
