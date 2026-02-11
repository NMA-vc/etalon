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
 * Generate a shields.io badge URL for an ETALON score.
 * Uses the shields.io endpoint badge format with the ETALON API.
 */
export function badgeUrl(grade: string, score: number): string {
  const color = grade === 'A' ? 'brightgreen' :
    grade === 'B' ? 'green' :
      grade === 'C' ? 'orange' :
        grade === 'D' ? 'red' : 'critical';
  return `https://img.shields.io/badge/ETALON-${grade}%20(${score}%2F100)-${color}?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iMyIgZmlsbD0iIzNCODJGNiIvPjx0ZXh0IHg9IjEwIiB5PSIxNSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIj5FPC90ZXh0Pjwvc3ZnPg==`;
}

/**
 * Generate markdown for embedding a badge.
 */
export function badgeMarkdown(grade: string, score: number): string {
  return `[![ETALON Privacy Score](${badgeUrl(grade, score)})](https://etalon.nma.vc)`;
}
