import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ShieldCheck, ShieldAlert } from "lucide-react";

interface TrackerVendor {
    id: string;
    name: string;
    category: string;
    risk_score: number;
    domains?: string[];
}

interface TrustVendorGridProps {
    vendors: TrackerVendor[];
}

const CATEGORY_LABELS: Record<string, string> = {
    analytics: "Analytics",
    advertising: "Advertising",
    social: "Social Media",
    cdn: "CDN",
    payments: "Payments",
    chat: "Live Chat",
    heatmaps: "Heatmaps",
    ab_testing: "A/B Testing",
    error_tracking: "Error Tracking",
    tag_manager: "Tag Manager",
    consent: "Consent",
    video: "Video",
    fonts: "Fonts",
    security: "Security",
    push: "Push Notifications",
    forms: "Forms",
    maps: "Maps",
    email_marketing: "Email Marketing",
    other: "Other",
};

export function TrustVendorGrid({ vendors }: TrustVendorGridProps) {
    // Sort: high risk first
    const sorted = [...vendors].sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((vendor) => {
                const isLowRisk = (vendor.risk_score ?? 5) < 4;
                const isMedRisk = (vendor.risk_score ?? 5) >= 4 && (vendor.risk_score ?? 5) < 7;

                return (
                    <Card
                        key={vendor.id}
                        className="bg-card/50 border-border/40 hover:border-border/80 transition-colors"
                    >
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    {isLowRisk ? (
                                        <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    ) : (
                                        <ShieldAlert className={`h-4 w-4 flex-shrink-0 ${isMedRisk ? "text-yellow-500" : "text-red-500"}`} />
                                    )}
                                    <h3 className="font-semibold text-sm">{vendor.name}</h3>
                                </div>
                                <span
                                    className={`text-xs font-mono font-medium ${isLowRisk
                                            ? "text-emerald-600"
                                            : isMedRisk
                                                ? "text-yellow-600"
                                                : "text-red-600"
                                        }`}
                                >
                                    {vendor.risk_score ?? "?"}/10
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                <Badge variant="secondary" className="text-[11px] px-2 py-0">
                                    {CATEGORY_LABELS[vendor.category] ?? vendor.category}
                                </Badge>
                            </div>

                            {vendor.domains && vendor.domains.length > 0 && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {vendor.domains[0]}
                                    {vendor.domains.length > 1 && ` +${vendor.domains.length - 1} more`}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
