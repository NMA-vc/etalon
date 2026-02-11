import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/posthog-provider";
import { CookieBanner } from "@/components/cookie-banner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ETALON — Privacy Auditing for the Modern Web",
  description: "Open-source privacy auditor. Scan websites for trackers, audit GDPR compliance, and maintain transparent data flow documentation.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://etalon.nma.vc"),
  openGraph: {
    title: "ETALON — Privacy Auditing for the Modern Web",
    description: "Open-source privacy auditor with CLI, MCP server, and cloud dashboard.",
    siteName: "ETALON",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <PostHogProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
          <CookieBanner />
        </PostHogProvider>
      </body>
    </html>
  );
}
