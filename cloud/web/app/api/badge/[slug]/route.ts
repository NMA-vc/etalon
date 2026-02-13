import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

/**
 * GET /api/badge/[slug]
 *
 * Returns a dynamic SVG badge showing the site's privacy grade.
 * Publicly accessible. Cached for 1 hour.
 *
 * Usage: <img src="https://etalon.nma.vc/api/badge/mysite" alt="Privacy Score" />
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get public site
    const { data: site } = await supabase
        .from("sites")
        .select("id")
        .eq("slug", slug)
        .eq("public", true)
        .single();

    if (!site) {
        return new Response(generateBadge("N/A", "#6b7280"), {
            headers: svgHeaders(60),
        });
    }

    // Get latest completed scan
    const { data: scan } = await supabase
        .from("scans")
        .select("grade, score")
        .eq("site_id", site.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

    const grade = scan?.grade ?? "N/A";
    const color: Record<string, string> = {
        A: "#10b981",
        B: "#3b82f6",
        C: "#f59e0b",
        D: "#f97316",
        F: "#ef4444",
    };

    return new Response(generateBadge(grade, color[grade] ?? "#6b7280"), {
        headers: svgHeaders(3600),
    });
}

function svgHeaders(maxAge: number): HeadersInit {
    return {
        "Content-Type": "image/svg+xml",
        "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    };
}

function generateBadge(grade: string, gradeColor: string): string {
    const labelWidth = 95;
    const gradeWidth = 55;
    const totalWidth = labelWidth + gradeWidth;
    const height = 28;
    const radius = 4;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <defs>
    <linearGradient id="bg" x2="0" y2="100%">
      <stop offset="0" stop-color="#555" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="cr">
      <rect width="${totalWidth}" height="${height}" rx="${radius}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#cr)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${gradeWidth}" height="${height}" fill="${gradeColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#bg)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="20" fill="#010101" fill-opacity=".3">privacy score</text>
    <text x="${labelWidth / 2}" y="19">privacy score</text>
    <text x="${labelWidth + gradeWidth / 2}" y="20" fill="#010101" fill-opacity=".3" font-weight="bold">${grade}</text>
    <text x="${labelWidth + gradeWidth / 2}" y="19" font-weight="bold">${grade}</text>
  </g>
</svg>`;
}
