import type { ComplianceScore, ComplianceGrade } from './types.js';
import { gradeColor } from './scoring.js';

/**
 * Generate a shields.io-style SVG badge for the compliance grade.
 */
export function generateBadgeSvg(score: ComplianceScore): string {
    const color = gradeColor(score.grade);
    const label = 'ETALON';
    const value = `${score.grade} (${score.score})`;

    const labelWidth = 50;
    const valueWidth = 55;
    const totalWidth = labelWidth + valueWidth;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

/**
 * Generate a badge URL for a GitHub repo.
 */
export function badgeUrl(owner: string, repo: string): string {
    return `https://etalon.nma.vc/badge/github/${owner}/${repo}`;
}

/**
 * Generate markdown for embedding a badge.
 */
export function badgeMarkdown(owner: string, repo: string): string {
    return `[![ETALON Privacy Score](${badgeUrl(owner, repo)})](https://etalon.nma.vc)`;
}
