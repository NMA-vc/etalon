import { execFileSync } from 'node:child_process';
import type { AuditFinding, BlameInfo } from './types.js';

/**
 * Check if we're inside a git repository.
 */
export function isGitRepo(cwd?: string): boolean {
    try {
        execFileSync('git', ['rev-parse', '--git-dir'], {
            stdio: 'ignore',
            cwd,
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Get blame info for a specific line in a file.
 */
export function getBlameForLine(
    filePath: string,
    lineNumber: number,
    cwd?: string,
): BlameInfo | null {
    try {
        const output = execFileSync(
            'git',
            ['blame', '-L', `${lineNumber},${lineNumber}`, '--porcelain', '--', filePath],
            { encoding: 'utf-8', cwd },
        );

        const lines = output.split('\n');
        const commit = lines[0]?.split(' ')[0] ?? '';

        const author =
            lines.find((l) => l.startsWith('author '))?.substring(7) ?? 'Unknown';
        const email =
            lines
                .find((l) => l.startsWith('author-mail '))
                ?.substring(12)
                .replace(/[<>]/g, '') ?? '';
        const timestamp =
            lines.find((l) => l.startsWith('author-time '))?.substring(12) ?? '';
        const summary =
            lines.find((l) => l.startsWith('summary '))?.substring(8) ?? '';

        const date = timestamp
            ? new Date(parseInt(timestamp, 10) * 1000).toISOString()
            : '';

        return { author, email, date, commit, commitMessage: summary };
    } catch {
        return null;
    }
}

/**
 * Enrich audit findings with git blame information.
 * Only enriches findings that have a file and line number.
 */
export function enrichFindings(
    findings: AuditFinding[],
    cwd?: string,
): AuditFinding[] {
    if (!isGitRepo(cwd)) return findings;

    return findings.map((finding) => {
        if (!finding.line) return finding;

        const blame = getBlameForLine(finding.file, finding.line, cwd);
        if (!blame) return finding;

        return { ...finding, blame };
    });
}

/**
 * Group findings by author for reporting.
 */
export function groupByAuthor(
    findings: AuditFinding[],
): Map<string, AuditFinding[]> {
    const grouped = new Map<string, AuditFinding[]>();

    for (const finding of findings) {
        if (!finding.blame) continue;
        const { author } = finding.blame;
        const list = grouped.get(author) ?? [];
        list.push(finding);
        grouped.set(author, list);
    }

    return grouped;
}
