import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Scan {
    id: string;
    completed_at: string;
    score: number;
    grade: string;
}

interface TrustTimelineProps {
    scans: Scan[];
}

const GRADE_STYLES: Record<string, string> = {
    A: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    B: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    C: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    D: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    F: "bg-red-500/10 text-red-700 border-red-500/20",
};

export function TrustTimeline({ scans }: TrustTimelineProps) {
    return (
        <Card className="bg-card/50 border-border/40">
            <CardContent className="p-6">
                <div className="space-y-3">
                    {scans.map((scan, index) => (
                        <div
                            key={scan.id}
                            className="flex items-center gap-4"
                        >
                            {/* Grade circle */}
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${GRADE_STYLES[scan.grade] ?? "bg-muted text-muted-foreground border-border"
                                    }`}
                            >
                                {scan.grade}
                            </div>

                            {/* Score + date */}
                            <div className="flex-1 flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    Score: {scan.score}/100
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(scan.completed_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>

                            {/* Latest badge */}
                            {index === 0 && (
                                <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                                    Latest
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
