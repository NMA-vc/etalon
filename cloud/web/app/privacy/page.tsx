import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy - ETALON",
    description: "ETALON privacy policy. Learn how we handle your data in compliance with GDPR.",
};

export default function PrivacyPolicyPage() {
    const lastUpdated = "February 11, 2026";

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="max-w-3xl mx-auto px-6 py-20">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
                    ← Back to ETALON
                </Link>

                <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground mb-10">Last updated: {lastUpdated}</p>

                <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground [&_a]:text-emerald-400 [&_a]:underline">

                    <section>
                        <h2>1. Data Controller</h2>
                        <p>
                            <strong>NMA Venture Capital GmbH</strong><br />
                            Am Sandtorkai 27<br />
                            D-20457 Hamburg, Germany<br />
                            Email: <a href="mailto:info@nma.vc">info@nma.vc</a><br />
                            Phone: +49 178 4497585
                        </p>
                    </section>

                    <section>
                        <h2>2. What Data We Collect</h2>

                        <h3>Account Data</h3>
                        <p>When you create an ETALON Cloud account, we collect:</p>
                        <ul className="list-disc ml-6 space-y-1">
                            <li>Email address (for authentication via magic link or GitHub OAuth)</li>
                            <li>GitHub profile information (if you sign in with GitHub)</li>
                        </ul>

                        <h3>Usage Data (with consent)</h3>
                        <p>If you accept analytics cookies, we collect anonymized usage data via <strong>PostHog</strong> (EU cloud, hosted in Frankfurt):</p>
                        <ul className="list-disc ml-6 space-y-1">
                            <li>Pages visited and navigation patterns</li>
                            <li>Feature usage (scans run, dashboard interactions)</li>
                            <li>Device type and browser (aggregated)</li>
                        </ul>
                        <p>This data is <strong>not collected</strong> if you decline cookies. PostHog is configured with <code className="text-xs bg-muted px-1.5 py-0.5 rounded">opt_out_capturing_by_default: true</code>.</p>

                        <h3>Scan Data</h3>
                        <p>When you run a privacy audit (via CLI or Cloud), ETALON processes:</p>
                        <ul className="list-disc ml-6 space-y-1">
                            <li>The URL or source code you submit for scanning</li>
                            <li>Scan results (detected trackers, findings, compliance scores)</li>
                        </ul>
                        <p>Scan data is stored in your account and is not shared with third parties.</p>

                        <h3>Payment Data</h3>
                        <p>Payments are processed by <strong>Stripe</strong>. We store only your Stripe customer ID and subscription status. We never see or store your credit card number.</p>
                    </section>

                    <section>
                        <h2>3. Legal Basis for Processing</h2>
                        <table className="text-sm w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-2 pr-4 text-foreground">Processing</th>
                                    <th className="text-left py-2 text-foreground">Legal Basis (GDPR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                <tr><td className="py-2 pr-4">Account creation & login</td><td className="py-2">Art. 6(1)(b) - Contract performance</td></tr>
                                <tr><td className="py-2 pr-4">Running scans</td><td className="py-2">Art. 6(1)(b) - Contract performance</td></tr>
                                <tr><td className="py-2 pr-4">Analytics cookies (PostHog)</td><td className="py-2">Art. 6(1)(a) - Consent</td></tr>
                                <tr><td className="py-2 pr-4">Payment processing (Stripe)</td><td className="py-2">Art. 6(1)(b) - Contract performance</td></tr>
                                <tr><td className="py-2 pr-4">Sidebar state cookie</td><td className="py-2">Art. 6(1)(f) - Legitimate interest (functional)</td></tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h2>4. Third-Party Processors</h2>
                        <table className="text-sm w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-2 pr-4 text-foreground">Service</th>
                                    <th className="text-left py-2 pr-4 text-foreground">Purpose</th>
                                    <th className="text-left py-2 text-foreground">Data Location</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                <tr><td className="py-2 pr-4">Supabase</td><td className="py-2 pr-4">Authentication & database</td><td className="py-2">EU (Frankfurt)</td></tr>
                                <tr><td className="py-2 pr-4">PostHog</td><td className="py-2 pr-4">Product analytics (consent-gated)</td><td className="py-2">EU (Frankfurt)</td></tr>
                                <tr><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Payment processing</td><td className="py-2">EU/US (SCCs)</td></tr>
                                <tr><td className="py-2 pr-4">Vercel</td><td className="py-2 pr-4">Hosting & CDN</td><td className="py-2">EU (Frankfurt)</td></tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h2>5. Your Rights (GDPR Art. 15–21)</h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc ml-6 space-y-1">
                            <li><strong>Access</strong> your personal data (Art. 15)</li>
                            <li><strong>Rectify</strong> inaccurate data (Art. 16)</li>
                            <li><strong>Erase</strong> your data (&ldquo;right to be forgotten&rdquo;, Art. 17)</li>
                            <li><strong>Restrict</strong> processing (Art. 18)</li>
                            <li><strong>Data portability</strong> - receive your data in a machine-readable format (Art. 20)</li>
                            <li><strong>Object</strong> to processing based on legitimate interest (Art. 21)</li>
                            <li><strong>Withdraw consent</strong> at any time for analytics cookies</li>
                        </ul>
                        <p>To exercise any of these rights, email <a href="mailto:info@nma.vc">info@nma.vc</a>.</p>
                    </section>

                    <section>
                        <h2>6. Data Retention</h2>
                        <ul className="list-disc ml-6 space-y-1">
                            <li><strong>Account data:</strong> Retained until you delete your account</li>
                            <li><strong>Scan results:</strong> Retained until you delete them or close your account</li>
                            <li><strong>Analytics data:</strong> Anonymized after 12 months</li>
                            <li><strong>Payment records:</strong> Retained for 10 years (German tax law)</li>
                        </ul>
                    </section>

                    <section>
                        <h2>7. Data Security</h2>
                        <p>We implement appropriate technical measures including:</p>
                        <ul className="list-disc ml-6 space-y-1">
                            <li>TLS encryption in transit</li>
                            <li>Row-Level Security (RLS) on all database tables</li>
                            <li>Content Security Policy headers</li>
                            <li>Secure, SameSite cookies</li>
                            <li>No PII in server logs</li>
                        </ul>
                    </section>

                    <section>
                        <h2>8. Cookies</h2>
                        <p>
                            For details on the cookies we use, please see our{" "}
                            <Link href="/cookies" className="text-emerald-400 underline">Cookie Policy</Link>.
                        </p>
                    </section>

                    <section>
                        <h2>9. Supervisory Authority</h2>
                        <p>
                            You have the right to lodge a complaint with a data protection authority.
                            Our lead supervisory authority is the <strong>Hamburgische Beauftragte für Datenschutz und Informationsfreiheit</strong>,
                            Ludwig-Erhard-Str. 22, 20459 Hamburg.
                        </p>
                    </section>

                    <section>
                        <h2>10. Changes to This Policy</h2>
                        <p>
                            We may update this privacy policy from time to time. Changes will be posted on this page with an updated date.
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-border/50 flex gap-4 text-xs text-muted-foreground">
                    <Link href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
                    <Link href="/imprint" className="hover:text-foreground transition-colors">Imprint</Link>
                </div>
            </div>
        </main>
    );
}
