"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const quotes = [
    {
        text: "This page respects your privacy more than most websites respect their 404s.",
        author: "ETALON Team",
    },
    {
        text: "Error 404: Your data not found (because we didn't track it).",
        author: "Privacy First",
    },
    {
        text: "Unlike this page, cookies should actually exist when you want them to.",
        author: "Cookie Monster, probably",
    },
    {
        text: "GDPR: Making lawyers rich and privacy a right since 2018.",
        author: "EU Regulation 2016/679",
    },
    {
        text: "This 404 has fewer trackers than a typical news website has 'Reject All' buttons.",
        author: "Dark Pattern Survivor",
    },
    {
        text: "We couldn't find what you're looking for, but at least 47 ad networks didn't find you either.",
        author: "Ad-free Zone",
    },
    {
        text: "Fun fact: Reading this error message requires accepting fewer cookies than visiting any major news site.",
        author: "Cookie Banner Fatigue Support Group",
    },
    {
        text: "Lost? At least you're not being tracked across 8,000 partner websites.",
        author: "Real Talk",
    },
    {
        text: "This page loads faster than it takes to scroll through a legitimate interest list.",
        author: "Performance Metrics",
    },
    {
        text: "Error 404: Like your digital privacy before GDPR.",
        author: "The Old Days",
    },
    {
        text: "We have 0 legitimate interest in tracking you. Unlike some people.",
        author: "Definitely Not IAB",
    },
    {
        text: "Breaking: Local 404 page contains no third-party trackers. Advertisers shocked.",
        author: "Privacy News Network",
    },
    {
        text: "This page is so privacy-friendly, even we don't know you're here.",
        author: "Anonymous Analytics",
    },
    {
        text: "404: The only cookies here are the ones in your kitchen.",
        author: "Cookie-Free Zone",
    },
    {
        text: "No legitimate interest was harmed in the making of this error page.",
        author: "TCF Survivor",
    },
];

export default function NotFound() {
    const [currentQuote, setCurrentQuote] = useState(0);
    const [easterEggFound, setEasterEggFound] = useState(false);
    const [trackersBlocked, setTrackersBlocked] = useState(0);
    const [fadeIn, setFadeIn] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFadeIn(false);
            setTimeout(() => {
                setCurrentQuote((prev) => (prev + 1) % quotes.length);
                setFadeIn(true);
            }, 400);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleTrackerClick = () => {
        setTrackersBlocked((prev) => prev + 1);
        if (trackersBlocked + 1 >= 10) {
            setEasterEggFound(true);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navbar */}
            <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/logo.png"
                            alt="ETALON"
                            width={40}
                            height={40}
                            className="rounded"
                        />
                        <span className="text-lg font-bold tracking-tight">ETALON</span>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to home
                        </Button>
                    </Link>
                </div>
            </nav>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center px-6 py-16">
                <div className="max-w-2xl w-full space-y-10">
                    {/* 404 Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mx-auto">
                            <Shield className="h-10 w-10 text-primary" />
                        </div>
                        <h1 className="text-8xl font-black tracking-tighter text-foreground/10 select-none">
                            404
                        </h1>
                        <h2 className="text-2xl font-bold text-foreground -mt-6">
                            Page Not Found
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            This page doesn&apos;t exist, but your privacy still does.
                        </p>
                    </div>

                    {/* Tracker counter — Easter Egg trigger */}
                    <div
                        onClick={handleTrackerClick}
                        className="group cursor-pointer rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-primary/30 hover:shadow-sm active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                            {easterEggFound ? (
                                <Eye className="h-4 w-4 text-primary" />
                            ) : (
                                <EyeOff className="h-4 w-4" />
                            )}
                            <span>Trackers blocked on this page</span>
                        </div>
                        <div className="text-5xl font-black text-primary tabular-nums">
                            {trackersBlocked}
                        </div>
                        {!easterEggFound && trackersBlocked > 0 && (
                            <p className="text-xs text-muted-foreground/60 mt-2 animate-pulse">
                                Keep going...
                            </p>
                        )}
                        {easterEggFound && (
                            <p className="text-sm text-primary mt-2 font-medium animate-in fade-in">
                                🎉 You found the Easter egg!
                            </p>
                        )}
                    </div>

                    {/* Easter Egg content */}
                    {easterEggFound && (
                        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-lg font-bold">🥚 Easter Egg Unlocked!</h3>
                            <p className="text-muted-foreground">
                                Fun fact: ETALON tracks{" "}
                                <strong className="text-foreground">26,886 trackers</strong>{" "}
                                across{" "}
                                <strong className="text-foreground">110,782 domains</strong>.
                            </p>
                            <p className="text-muted-foreground">
                                That&apos;s a lot of nosy neighbors we&apos;re keeping an eye on
                                for you! 👀
                            </p>
                        </div>
                    )}

                    {/* Rotating quote */}
                    <blockquote
                        className={`border-l-4 border-primary/30 pl-6 py-2 transition-opacity duration-400 ${fadeIn ? "opacity-100" : "opacity-0"
                            }`}
                    >
                        <p className="text-foreground/80 italic text-[15px] leading-relaxed">
                            &ldquo;{quotes[currentQuote].text}&rdquo;
                        </p>
                        <cite className="text-sm text-muted-foreground not-italic mt-2 block">
                            — {quotes[currentQuote].author}
                        </cite>
                    </blockquote>

                    {/* Code block */}
                    <div className="rounded-xl border border-border bg-zinc-950 p-5 font-mono text-sm overflow-x-auto">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-3 h-3 rounded-full bg-red-500/80" />
                            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <span className="w-3 h-3 rounded-full bg-green-500/80" />
                            <span className="text-zinc-500 text-xs ml-2">privacy.ts</span>
                        </div>
                        <pre className="text-zinc-300 leading-relaxed">
                            <code>
                                <span className="text-purple-400">if</span>
                                <span className="text-zinc-400"> (</span>
                                <span className="text-zinc-200">userWants404Page</span>
                                <span className="text-zinc-400">) {"{"}</span>
                                {"\n"}
                                {"  "}
                                <span className="text-zinc-200">trackUser</span>
                                <span className="text-zinc-400"> = </span>
                                <span className="text-orange-400">false</span>
                                <span className="text-zinc-400">;</span>
                                {"\n"}
                                {"  "}
                                <span className="text-zinc-200">respectPrivacy</span>
                                <span className="text-zinc-400"> = </span>
                                <span className="text-green-400">true</span>
                                <span className="text-zinc-400">;</span>
                                {"\n"}
                                <span className="text-zinc-400">{"}"}</span>
                            </code>
                        </pre>
                        <p className="text-zinc-500 text-xs mt-3">
                            ^ Code that actually runs on this page
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link href="/">
                            <Button size="lg" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Go back home
                            </Button>
                        </Link>
                        <Link href="https://github.com/NMA-vc/etalon/issues" target="_blank">
                            <Button variant="outline" size="lg">
                                Report a broken link
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Zero trackers. Zero cookies. Just a missing page.
                </p>
            </footer>
        </div>
    );
}
