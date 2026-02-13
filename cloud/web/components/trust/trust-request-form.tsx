"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, FileText } from "lucide-react";

interface TrustRequestFormProps {
    siteSlug: string;
}

export function TrustRequestForm({ siteSlug }: TrustRequestFormProps) {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);

        // TODO: Wire to actual endpoint when email service is ready
        // For now, simulate success
        await new Promise((r) => setTimeout(r, 800));

        setSubmitted(true);
        setLoading(false);
    };

    if (submitted) {
        return (
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="flex flex-col items-center py-10 text-center">
                    <CheckCircle className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Request Submitted</h3>
                    <p className="text-muted-foreground">
                        We&apos;ll send the detailed compliance report to{" "}
                        <strong className="text-foreground">{email}</strong>
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/50 border-border/40">
            <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                    <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-lg font-semibold mb-1">
                            Request Full Compliance Report
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Get the complete technical due diligence report including detailed audit
                            findings, remediation recommendations, and compliance documentation.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex gap-3">
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="flex-1"
                    />
                    <Button type="submit" disabled={loading}>
                        {loading ? "Sending..." : "Request Access"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
