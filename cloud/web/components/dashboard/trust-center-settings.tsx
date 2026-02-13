"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface TrustCenterSettingsProps {
    siteId: string;
    slug: string;
    isPublic: boolean;
}

export function TrustCenterSettings({ siteId, slug, isPublic: initialPublic }: TrustCenterSettingsProps) {
    const [isPublic, setIsPublic] = useState(initialPublic);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const trustUrl = `https://etalon.nma.vc/trust/${slug}`;
    const badgeUrl = `https://etalon.nma.vc/api/badge/${slug}`;
    const badgeMarkdown = `[![Privacy Score](${badgeUrl})](${trustUrl})`;

    const handleToggle = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/sites/${siteId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ public: !isPublic }),
            });

            if (response.ok) {
                setIsPublic(!isPublic);
                toast.success(isPublic ? "Trust Center disabled" : "Trust Center enabled");
            } else {
                toast.error("Failed to update setting");
            }
        } catch {
            toast.error("Failed to update setting");
        }
        setSaving(false);
    };

    const copyToClipboard = async (text: string, label: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(label);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <Card className="bg-card/50 border-border/40">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            Public Trust Center
                        </CardTitle>
                        <CardDescription>
                            Make your compliance status visible to customers and investors
                        </CardDescription>
                    </div>

                    <button
                        onClick={handleToggle}
                        disabled={saving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isPublic ? "bg-primary" : "bg-muted"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>
            </CardHeader>

            {isPublic && (
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Trust Center URL</Label>
                        <div className="flex items-center gap-2">
                            <Input value={trustUrl} readOnly className="text-sm font-mono" />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(trustUrl, "url")}
                            >
                                {copied === "url" ? (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                            <a href={trustUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="icon">
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </a>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Badge (Markdown)</Label>
                        <div className="flex items-center gap-2">
                            <Input value={badgeMarkdown} readOnly className="text-sm font-mono text-xs" />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(badgeMarkdown, "badge")}
                            >
                                {copied === "badge" ? (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={badgeUrl} alt="Privacy Score Badge" className="h-7" />
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
