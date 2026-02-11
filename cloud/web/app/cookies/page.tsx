import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Cookie Policy - ETALON",
    description: "ETALON cookie policy. Details on which cookies we use and how to manage them.",
};

export default function CookiePolicyPage() {
    const lastUpdated = "February 11, 2026";

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="max-w-3xl mx-auto px-6 py-20">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
                    ← Back to ETALON
                </Link>

                <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
                <p className="text-sm text-muted-foreground mb-10">Last updated: {lastUpdated}</p>

                <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground [&_a]:text-emerald-400 [&_a]:underline">

                    <section>
                        <h2>1. What Are Cookies</h2>
                        <p>
                            Cookies are small text files stored on your device when you visit a website.
                            They are widely used to make websites work, improve user experience, and provide analytics.
                        </p>
                    </section>

                    <section>
                        <h2>2. Cookies We Use</h2>
                        <p>ETALON uses a minimal set of cookies, classified as follows:</p>

                        <h3>Strictly Necessary Cookies</h3>
                        <p>These cookies are essential for the website to function. They do not require consent under GDPR.</p>
                        <table className="text-sm w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-2 pr-4 text-foreground">Cookie</th>
                                    <th className="text-left py-2 pr-4 text-foreground">Provider</th>
                                    <th className="text-left py-2 pr-4 text-foreground">Purpose</th>
                                    <th className="text-left py-2 text-foreground">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                <tr>
                                    <td className="py-2 pr-4"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">sidebar_state</code></td>
                                    <td className="py-2 pr-4">ETALON</td>
                                    <td className="py-2 pr-4">Remembers sidebar open/collapsed preference</td>
                                    <td className="py-2">7 days</td>
                                </tr>
                                <tr>
                                    <td className="py-2 pr-4"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">sb-*-auth-token</code></td>
                                    <td className="py-2 pr-4">Supabase</td>
                                    <td className="py-2 pr-4">Authentication session management</td>
                                    <td className="py-2">Session</td>
                                </tr>
                            </tbody>
                        </table>

                        <h3>Analytics Cookies (Consent Required)</h3>
                        <p>These cookies are <strong>only set after you click &ldquo;Accept&rdquo;</strong> on the cookie banner.</p>
                        <table className="text-sm w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-2 pr-4 text-foreground">Cookie</th>
                                    <th className="text-left py-2 pr-4 text-foreground">Provider</th>
                                    <th className="text-left py-2 pr-4 text-foreground">Purpose</th>
                                    <th className="text-left py-2 text-foreground">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                <tr>
                                    <td className="py-2 pr-4"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">ph_*</code></td>
                                    <td className="py-2 pr-4">PostHog (EU)</td>
                                    <td className="py-2 pr-4">Anonymous usage analytics, pageview tracking</td>
                                    <td className="py-2">1 year</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="text-xs mt-2">
                            PostHog is hosted on EU servers (Frankfurt) via <code className="text-xs bg-muted px-1.5 py-0.5 rounded">eu.i.posthog.com</code>.
                            No data is transferred outside the EU.
                        </p>

                        <h3>Cookies We Do NOT Use</h3>
                        <ul className="list-disc ml-6 space-y-1">
                            <li>No advertising or marketing cookies</li>
                            <li>No social media tracking pixels</li>
                            <li>No cross-site tracking</li>
                            <li>No fingerprinting</li>
                        </ul>
                    </section>

                    <section>
                        <h2>3. Local Storage</h2>
                        <p>We use browser local storage for:</p>
                        <table className="text-sm w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-2 pr-4 text-foreground">Key</th>
                                    <th className="text-left py-2 text-foreground">Purpose</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                <tr>
                                    <td className="py-2 pr-4"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">etalon_analytics_consent</code></td>
                                    <td className="py-2">Stores your cookie consent preference (granted/revoked)</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h2>4. Managing Your Preferences</h2>
                        <p>You can manage your cookie preferences in several ways:</p>
                        <ul className="list-disc ml-6 space-y-1">
                            <li><strong>Cookie banner:</strong> Accept or decline when first visiting the site</li>
                            <li><strong>Browser settings:</strong> Block or delete cookies through your browser</li>
                            <li><strong>Clear consent:</strong> Clear your browser&apos;s local storage to reset your preference and see the banner again</li>
                        </ul>
                    </section>

                    <section>
                        <h2>5. Third-Party Cookies</h2>
                        <p>
                            <strong>Stripe</strong> may set cookies during payment flows (checkout and billing portal).
                            These are loaded in an iframe and are necessary for payment processing.
                            See{" "}
                            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                                Stripe&apos;s Privacy Policy
                            </a>.
                        </p>
                    </section>

                    <section>
                        <h2>6. Updates</h2>
                        <p>
                            We may update this cookie policy when we add or remove cookies.
                            Changes will be posted on this page.
                        </p>
                    </section>

                    <section>
                        <h2>7. Contact</h2>
                        <p>
                            If you have questions about our use of cookies, contact us at{" "}
                            <a href="mailto:info@nma.vc">info@nma.vc</a>.
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-border/50 flex gap-4 text-xs text-muted-foreground">
                    <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                    <Link href="/imprint" className="hover:text-foreground transition-colors">Imprint</Link>
                </div>
            </div>
        </main>
    );
}
