"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   IntelligenceStrip — Horizontal scrolling counter bar
   Shows live metrics from the ETALON vendor database
   ═══════════════════════════════════════════════════════════ */

const COUNTERS = [
    { value: "26,886", label: "Vendor Profiles", icon: "🏢" },
    { value: "111,603", label: "Tracked Domains", icon: "🌐" },
    { value: "23", label: "Categories", icon: "📂" },
    { value: "138", label: "Detection Patterns", icon: "🔍" },
    { value: "11", label: "Frameworks", icon: "⚙️" },
    { value: "8", label: "Regulations", icon: "📜" },
    { value: "28", label: "GDPR Rules", icon: "🇪🇺" },
    { value: "6", label: "Scanners", icon: "🛡️" },
];

// Duplicate for infinite scroll effect
const ITEMS = [...COUNTERS, ...COUNTERS];

function AnimatedNumber({ target }: { target: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const [displayed, setDisplayed] = useState("0");
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (hasAnimated) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasAnimated(true);
                    observer.disconnect();

                    const numericTarget = parseInt(target.replace(/,/g, ""), 10);
                    const duration = 1200;
                    const startTime = performance.now();

                    function animate(currentTime: number) {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        // Ease-out cubic
                        const eased = 1 - Math.pow(1 - progress, 3);
                        const current = Math.floor(eased * numericTarget);
                        setDisplayed(current.toLocaleString());
                        if (progress < 1) requestAnimationFrame(animate);
                    }

                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, hasAnimated]);

    return <span ref={ref}>{displayed}</span>;
}

export function IntelligenceStrip() {
    return (
        <section className="py-6 border-y border-border/40 bg-muted/30 overflow-hidden">
            <div className="mx-auto max-w-6xl px-6 mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                    Live Intelligence Database
                </p>
            </div>

            {/* Scrolling ticker */}
            <div className="relative">
                {/* Fade edges */}
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

                <motion.div
                    className="flex gap-8 whitespace-nowrap"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 30,
                            ease: "linear",
                        },
                    }}
                >
                    {ITEMS.map((item, i) => (
                        <div
                            key={`${item.label}-${i}`}
                            className="flex items-center gap-3 px-5 py-2.5 rounded-lg border border-border/30 bg-card/50"
                        >
                            <span className="text-lg">{item.icon}</span>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-foreground tabular-nums">
                                    <AnimatedNumber target={item.value} />
                                </span>
                                <span className="text-xs text-muted-foreground">{item.label}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
