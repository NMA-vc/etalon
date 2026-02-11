import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <Image src="/logo.png" alt="ETALON" width={40} height={40} className="rounded" />
                    <span className="text-lg font-bold tracking-tight">ETALON</span>
                </Link>

                {/* Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="/#mcp-server" className="text-sm text-muted-foreground hover:text-primary transition-colors">AI Agents</a>
                    <a href="/#commands" className="text-sm text-muted-foreground hover:text-primary transition-colors">Commands</a>
                    <a href="/#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</a>
                    <a href="https://github.com/NMA-vc/etalon" target="_blank" rel="noopener" className="text-sm text-muted-foreground hover:text-primary transition-colors">GitHub</a>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-3">
                    <Link href="/login">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            Log in
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button size="sm" className="dark:shadow-[0_0_20px_rgb(26_107_122/0.3)] dark:hover:shadow-[0_0_30px_rgb(26_107_122/0.5)]">
                            Start Free Scan
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
