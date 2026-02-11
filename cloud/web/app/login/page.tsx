"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const supabase = createClient();

    async function handleMagicLink(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        setLoading(false);
        if (error) {
            toast.error(error.message);
        } else {
            setSent(true);
        }
    }

    async function handleGitHub() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) toast.error(error.message);
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-muted-foreground">Sign in to your ETALON Cloud dashboard</p>
                    </div>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="text-center">
                            <CardTitle>{sent ? "Check your email" : "Sign in"}</CardTitle>
                            <CardDescription>
                                {sent
                                    ? `We sent a magic link to ${email}`
                                    : "Choose your preferred sign-in method"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sent ? (
                                <div className="text-center space-y-4">
                                    <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <Button variant="ghost" onClick={() => setSent(false)} className="text-sm">
                                        Try a different email
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        className="w-full h-11"
                                        onClick={handleGitHub}
                                    >
                                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        Continue with GitHub
                                    </Button>

                                    <div className="relative">
                                        <Separator />
                                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                                            or
                                        </span>
                                    </div>

                                    <form onSubmit={handleMagicLink} className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="h-11"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full h-11"
                                            disabled={loading}
                                        >
                                            {loading ? "Sending..." : "Send magic link"}
                                        </Button>
                                    </form>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-muted-foreground">
                        By signing in, you agree to our{" "}
                        <Link href="/agb" className="underline hover:text-foreground">Terms</Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
