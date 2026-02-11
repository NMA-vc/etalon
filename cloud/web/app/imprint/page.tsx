import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Imprint — ETALON",
    description: "Legal imprint for ETALON by NMA Venture Capital GmbH",
};

export default function ImprintPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="max-w-2xl mx-auto px-6 py-20">
                <h1 className="text-3xl font-bold mb-10">Imprint</h1>

                <section className="space-y-8 text-muted-foreground">
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-2">
                            Managing Partner
                        </h3>
                        <p>Nico Lumma / Christoph Hüning</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-2">
                            Address
                        </h3>
                        <p>NMA Venture Capital GmbH</p>
                        <p>Am Sandtorkai 27</p>
                        <p>D-20457 Hamburg</p>
                        <p className="mt-2">
                            <a href="mailto:info@nma.vc" className="hover:text-primary transition-colors">info@nma.vc</a>
                        </p>
                        <p>
                            Phone: <a href="tel:+491784497585" className="hover:text-primary transition-colors">+49 178 4497585</a>
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-2">
                            Legal
                        </h3>
                        <p>HRB 136790</p>
                        <p>UStID (VAT ID) DE300254362</p>
                    </div>
                </section>
            </div>
        </main>
    );
}
