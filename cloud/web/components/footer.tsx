import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
    return (
        <footer className="border-t border-border/40 py-12">
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <Image src="/logo.png" alt="ETALON" width={32} height={32} className="rounded" />
                            <span className="font-bold">ETALON</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Privacy audit tool for AI coding agents and developers.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4">Product</h4>
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                            <li><a href="/#features" className="hover:text-primary transition-colors">Features</a></li>
                            <li><a href="/#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                            <li><a href="/#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
                            <li><Link href="/login" className="hover:text-primary transition-colors">Dashboard</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-4">Developers</h4>
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                            <li><a href="https://github.com/NMA-vc/etalon" className="hover:text-primary transition-colors">GitHub</a></li>
                            <li><a href="https://github.com/NMA-vc/etalon#readme" className="hover:text-primary transition-colors">Documentation</a></li>
                            <li><a href="https://github.com/NMA-vc/etalon/issues" className="hover:text-primary transition-colors">Report a Bug</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/agb" className="hover:text-primary transition-colors">AGB</Link></li>
                            <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                            <li><Link href="/imprint" className="hover:text-primary transition-colors">Imprint</Link></li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-8" />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} ETALON. Open-source under MIT License.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Built by <a href="https://nma.vc" className="text-primary hover:underline">NMA</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
