"use client";

import { ScoreRing } from "@/components/dashboard/score-ring";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle, Clock } from "lucide-react";

interface TrustHeroProps {
    siteName: string;
    siteUrl: string;
    score: number | null;
    grade: string | null;
    lastVerified: string | null;
}

export function TrustHero({ siteName, siteUrl, score, grade, lastVerified }: TrustHeroProps) {
    return (
        <div className="text-center space-y-8">
            {/* Site info */}
            <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight">{siteName}</h1>
                <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                    {siteUrl}
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
            </div>

            {/* Score gauge */}
            {score !== null && grade !== null && (
                <div className="flex flex-col items-center gap-4">
                    <ScoreRing score={score} grade={grade} size={160} strokeWidth={10} />

                    <div className="flex items-center gap-4">
                        <Badge
                            variant="outline"
                            className={
                                grade === "A"
                                    ? "border-emerald-500/30 text-emerald-600"
                                    : grade === "B"
                                        ? "border-blue-500/30 text-blue-600"
                                        : grade === "C"
                                            ? "border-yellow-500/30 text-yellow-600"
                                            : grade === "D"
                                                ? "border-orange-500/30 text-orange-600"
                                                : "border-red-500/30 text-red-600"
                            }
                        >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Grade {grade}
                        </Badge>

                        {lastVerified && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Verified {new Date(lastVerified).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* No score state */}
            {score === null && (
                <p className="text-muted-foreground">
                    Awaiting first privacy scan...
                </p>
            )}
        </div>
    );
}
