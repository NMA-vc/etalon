import { readFileSync } from 'node:fs';
import { basename, relative, extname } from 'node:path';
import type {
    AuditFinding,
    StackInfo,
    TrackerPatternDatabase,
} from './types.js';
import { checkPatterns } from '../patterns/index.js';

// File extensions to scan
const CODE_EXTENSIONS = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.py', '.pyw',
    '.rs',
    '.html', '.htm', '.ejs', '.hbs', '.pug', '.jinja', '.jinja2', '.j2',
    '.vue', '.svelte', '.astro',
    '.env', '.env.local', '.env.production', '.env.development',
]);

const IGNORE_DIRS = new Set([
    'node_modules', '.next', '__pycache__', '.git', 'dist', 'build',
    'target', '.venv', 'venv', 'env', '.tox', '.mypy_cache',
    'vendor', '.cargo', 'coverage', '.turbo',
]);

/**
 * Scan source files for tracker SDK usage, hardcoded tracking pixels,
 * tracker-related env vars, and raw cookie writes.
 */
export function scanCode(
    files: string[],
    baseDir: string,
    stack: StackInfo,
    patterns: TrackerPatternDatabase,
): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // 1. Scan package manifest for tracker dependencies
    findings.push(...scanPackageManifest(baseDir, stack, patterns));

    // 2. Scan source files
    for (const filePath of files) {
        if (!shouldScanFile(filePath)) continue;

        try {
            const content = readFileSync(filePath, 'utf-8');
            const relPath = relative(baseDir, filePath);
            const ext = extname(filePath).toLowerCase();

            // .env files — check for tracker env vars
            if (basename(filePath).startsWith('.env')) {
                findings.push(...scanEnvFile(content, relPath, patterns));
                continue;
            }

            // HTML/template files — check for hardcoded tracking pixels
            if (['.html', '.htm', '.ejs', '.hbs', '.pug', '.jinja', '.jinja2', '.j2'].includes(ext)) {
                findings.push(...scanHtmlFile(content, relPath, patterns));
            }

            // JS/TS/Vue/Svelte — check for tracker imports and cookie usage
            if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte', '.astro'].includes(ext)) {
                findings.push(...scanJsFile(content, relPath, patterns));
                findings.push(...scanCookieUsage(content, relPath));
                findings.push(...scanLocalStorage(content, relPath));
            }

            // Python files
            if (['.py', '.pyw'].includes(ext)) {
                findings.push(...scanPythonFile(content, relPath, patterns));
            }

            // Rust files
            if (ext === '.rs') {
                findings.push(...scanRustFile(content, relPath, patterns));
            }

            // All files — check inline HTML patterns (JSX, templates)
            findings.push(...scanForHtmlPatterns(content, relPath, patterns));

        } catch {
            // Skip files we can't read
        }
    }

    return deduplicateFindings(filterFalsePositives(findings));
}

export function shouldScanFile(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    const name = basename(filePath);
    if (name.startsWith('.env')) return true;
    if (!CODE_EXTENSIONS.has(ext)) return false;

    // Ignore files in excluded directories
    const parts = filePath.split('/');
    for (const part of parts) {
        if (IGNORE_DIRS.has(part)) return false;
    }

    return true;
}

// ─── Package Manifest Scanning ─────────────────────────────────

function scanPackageManifest(
    baseDir: string,
    stack: StackInfo,
    patterns: TrackerPatternDatabase,
): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // npm / package.json
    if (stack.languages.includes('javascript') || stack.languages.includes('typescript')) {
        try {
            const pkg = JSON.parse(readFileSync(`${baseDir}/package.json`, 'utf-8'));
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            for (const dep of Object.keys(allDeps)) {
                const match = patterns.npm[dep];
                if (match) {
                    findings.push({
                        id: `code-tracker-dep-${dep}`,
                        category: 'code',
                        severity: match.severity,
                        title: `Tracker SDK dependency: ${dep}`,
                        message: `Package "${dep}" is a known tracker SDK (vendor: ${match.vendorId}). Ensure it is loaded behind a consent mechanism.`,
                        file: 'package.json',
                        vendorId: match.vendorId,
                        rule: 'tracker-dependency',
                    });
                }
            }
        } catch {
            // No package.json
        }
    }

    // Python requirements
    if (stack.languages.includes('python')) {
        for (const reqFile of ['requirements.txt', 'pyproject.toml']) {
            try {
                const content = readFileSync(`${baseDir}/${reqFile}`, 'utf-8');
                for (const [pkg, match] of Object.entries(patterns.pypi)) {
                    if (content.toLowerCase().includes(pkg.toLowerCase())) {
                        findings.push({
                            id: `code-tracker-dep-${pkg}`,
                            category: 'code',
                            severity: match.severity,
                            title: `Tracker SDK dependency: ${pkg}`,
                            message: `Python package "${pkg}" is a known tracker SDK (vendor: ${match.vendorId}). Ensure it has proper consent handling.`,
                            file: reqFile,
                            vendorId: match.vendorId,
                            rule: 'tracker-dependency',
                        });
                    }
                }
            } catch {
                // File not found
            }
        }
    }

    // Rust Cargo.toml
    if (stack.languages.includes('rust')) {
        try {
            const content = readFileSync(`${baseDir}/Cargo.toml`, 'utf-8');
            for (const [crate, match] of Object.entries(patterns.cargo)) {
                if (content.includes(crate)) {
                    findings.push({
                        id: `code-tracker-dep-${crate}`,
                        category: 'code',
                        severity: match.severity,
                        title: `Tracker SDK dependency: ${crate}`,
                        message: `Cargo crate "${crate}" is a known tracker SDK (vendor: ${match.vendorId}).`,
                        file: 'Cargo.toml',
                        vendorId: match.vendorId,
                        rule: 'tracker-dependency',
                    });
                }
            }
        } catch {
            // No Cargo.toml
        }
    }

    return findings;
}

// ─── .env Scanning ─────────────────────────────────────────────

function scanEnvFile(
    content: string,
    filePath: string,
    patterns: TrackerPatternDatabase,
): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;

        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) continue;
        const key = line.slice(0, eqIndex).trim();

        const match = patterns.envVars[key];
        if (match) {
            findings.push({
                id: `code-env-tracker-${key}`,
                category: 'code',
                severity: match.severity,
                title: `Tracker env variable: ${key}`,
                message: `Environment variable "${key}" configures ${match.vendorId}. Document this third-party in your privacy policy.`,
                file: filePath,
                line: i + 1,
                vendorId: match.vendorId,
                rule: 'tracker-env-var',
            });
        }
    }

    return findings;
}

// ─── HTML / Template Scanning ──────────────────────────────────

function scanHtmlFile(
    content: string,
    filePath: string,
    patterns: TrackerPatternDatabase,
): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        for (const hp of patterns.htmlPatterns) {
            if (lines[i].includes(hp.pattern)) {
                findings.push({
                    id: `code-html-tracker-${hp.vendorId}-${filePath}`,
                    category: 'code',
                    severity: hp.severity,
                    title: `Hardcoded tracking pixel: ${hp.vendorId}`,
                    message: `Found "${hp.pattern}" loaded directly in HTML. This should be gated behind user consent.`,
                    file: filePath,
                    line: i + 1,
                    vendorId: hp.vendorId,
                    rule: 'hardcoded-tracker',
                });
            }
        }
    }

    return findings;
}

// Scan for HTML patterns in any file (JSX, templates, etc.)
function scanForHtmlPatterns(
    content: string,
    filePath: string,
    patterns: TrackerPatternDatabase,
): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        for (const hp of patterns.htmlPatterns) {
            if (lines[i].includes(hp.pattern)) {
                findings.push({
                    id: `code-inline-tracker-${hp.vendorId}-${filePath}-${i}`,
                    category: 'code',
                    severity: hp.severity,
                    title: `Inline tracking script: ${hp.vendorId}`,
                    message: `Found "${hp.pattern}" in source. Ensure this is loaded conditionally behind consent.`,
                    file: filePath,
                    line: i + 1,
                    vendorId: hp.vendorId,
                    rule: 'inline-tracker',
                });
            }
        }
    }

    return findings;
}

// ─── JS/TS Scanning ────────────────────────────────────────────

function scanJsFile(
    content: string,
    filePath: string,
    patterns: TrackerPatternDatabase,
): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    // Check for tracker-related imports
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // import ... from 'package' or require('package')
        const importMatch = line.match(/(?:from\s+['"]|require\s*\(\s*['"])([^'"]+)['"]/);
        if (importMatch) {
            const pkg = importMatch[1];
            // Check direct npm package match
            const match = patterns.npm[pkg];
            if (match) {
                findings.push({
                    id: `code-import-${match.vendorId}-${filePath}-${i}`,
                    category: 'code',
                    severity: match.severity,
                    title: `Tracker SDK import: ${pkg}`,
                    message: `Importing "${pkg}" (${match.vendorId}). Ensure this is initialized only after user consent.`,
                    file: filePath,
                    line: i + 1,
                    vendorId: match.vendorId,
                    rule: 'tracker-import',
                });
            }
        }

        // Check import patterns (function calls, global references)
        for (const ip of patterns.importPatterns) {
            if (ip.language === 'javascript' && line.includes(ip.pattern)) {
                findings.push({
                    id: `code-pattern-${ip.vendorId}-${filePath}-${i}`,
                    category: 'code',
                    severity: ip.severity,
                    title: `Tracker API usage: ${ip.vendorId}`,
                    message: `Found "${ip.pattern}" usage. Ensure proper consent before tracking.`,
                    file: filePath,
                    line: i + 1,
                    vendorId: ip.vendorId,
                    rule: 'tracker-api-call',
                });
            }
        }

        // Check for direct fetch/axios calls to known tracker domains
        const urlMatch = line.match(/(?:fetch|axios\.\w+|http\.get|http\.post)\s*\(\s*['"`]([^'"`]+)['"`]/);
        if (urlMatch) {
            const url = urlMatch[1];
            for (const hp of patterns.htmlPatterns) {
                if (url.includes(hp.pattern)) {
                    findings.push({
                        id: `code-fetch-${hp.vendorId}-${filePath}-${i}`,
                        category: 'code',
                        severity: hp.severity,
                        title: `HTTP call to tracker: ${hp.vendorId}`,
                        message: `Direct HTTP request to "${url}" detected.`,
                        file: filePath,
                        line: i + 1,
                        vendorId: hp.vendorId,
                        rule: 'tracker-http-call',
                    });
                }
            }
        }
    }

    return findings;
}

// ─── Cookie Usage Scanning ─────────────────────────────────────

function scanCookieUsage(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // document.cookie write without consent check
        if (line.includes('document.cookie') && line.includes('=') && !line.includes('===') && !line.includes('!==')) {
            // Check if there's a consent guard nearby (within 10 lines above)
            const contextStart = Math.max(0, i - 10);
            const context = lines.slice(contextStart, i).join('\n').toLowerCase();
            const hasConsentGuard = context.includes('consent') || context.includes('cookie_accepted') || context.includes('gdpr');

            if (!hasConsentGuard) {
                findings.push({
                    id: `code-cookie-no-consent-${filePath}-${i}`,
                    category: 'code',
                    severity: 'high',
                    title: 'Cookie write without consent check',
                    message: 'Writing to document.cookie without an apparent consent guard. GDPR requires user consent before setting non-essential cookies.',
                    file: filePath,
                    line: i + 1,
                    rule: 'cookie-no-consent',
                    fix: 'Gate cookie writes behind a consent check, e.g. `if (hasConsent("analytics")) { document.cookie = ... }`',
                });
            }
        }

        // Express cookie-parser or res.cookie without secure flags
        if (line.includes('res.cookie(') || line.includes('response.set_cookie(')) {
            if (!content.includes('httpOnly') && !content.includes('HttpOnly') && !content.includes('httponly')) {
                findings.push({
                    id: `code-cookie-insecure-${filePath}-${i}`,
                    category: 'code',
                    severity: 'medium',
                    title: 'Cookie set without HttpOnly flag',
                    message: 'Setting a cookie without explicit HttpOnly flag. Consider adding httpOnly: true for security.',
                    file: filePath,
                    line: i + 1,
                    rule: 'cookie-insecure',
                });
            }
        }
    }

    return findings;
}

// ─── localStorage/sessionStorage PII ───────────────────────────

function scanLocalStorage(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    const piiKeys = ['email', 'phone', 'name', 'address', 'user', 'token', 'password', 'ssn', 'dob', 'birth'];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();

        if (line.includes('localstorage.setitem') || line.includes('sessionstorage.setitem')) {
            const keyMatch = lines[i].match(/(?:localStorage|sessionStorage)\.setItem\s*\(\s*['"]([^'"]+)['"]/i);
            if (keyMatch) {
                const key = keyMatch[1].toLowerCase();
                for (const piiKey of piiKeys) {
                    if (key.includes(piiKey)) {
                        findings.push({
                            id: `code-storage-pii-${filePath}-${i}`,
                            category: 'code',
                            severity: 'medium',
                            title: `PII stored in browser storage: "${keyMatch[1]}"`,
                            message: `Storing potentially sensitive data ("${keyMatch[1]}") in browser storage. Consider using HttpOnly cookies or server-side sessions instead.`,
                            file: filePath,
                            line: i + 1,
                            rule: 'storage-pii',
                        });
                        break;
                    }
                }
            }
        }
    }

    return findings;
}

// ─── Python Scanning ───────────────────────────────────────────

function scanPythonFile(
    content: string,
    filePath: string,
    patterns: TrackerPatternDatabase,
): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Python imports: from X import Y or import X
        const importMatch = line.match(/(?:from\s+(\S+)\s+import|^import\s+(\S+))/);
        if (importMatch) {
            const pkg = (importMatch[1] || importMatch[2]).split('.')[0].toLowerCase();
            for (const [pyPkg, match] of Object.entries(patterns.pypi)) {
                if (pkg === pyPkg.toLowerCase().replace(/-/g, '_') || pkg === pyPkg.toLowerCase().replace(/-/g, '')) {
                    findings.push({
                        id: `code-python-import-${match.vendorId}-${filePath}-${i}`,
                        category: 'code',
                        severity: match.severity,
                        title: `Tracker SDK import: ${pyPkg}`,
                        message: `Python import of "${pkg}" (${match.vendorId}). Ensure proper consent handling.`,
                        file: filePath,
                        line: i + 1,
                        vendorId: match.vendorId,
                        rule: 'tracker-import',
                    });
                }
            }
        }

        // Check import patterns
        for (const ip of patterns.importPatterns) {
            if (ip.language === 'python' && line.includes(ip.pattern)) {
                findings.push({
                    id: `code-python-pattern-${ip.vendorId}-${filePath}-${i}`,
                    category: 'code',
                    severity: ip.severity,
                    title: `Tracker usage: ${ip.vendorId}`,
                    message: `Found "${ip.pattern}" in Python source.`,
                    file: filePath,
                    line: i + 1,
                    vendorId: ip.vendorId,
                    rule: 'tracker-api-call',
                });
            }
        }

        // Django INSTALLED_APPS with tracker apps
        if (line.includes("'analytical'") || line.includes("'django_analytical'")) {
            findings.push({
                id: `code-django-analytical-${filePath}-${i}`,
                category: 'code',
                severity: 'medium',
                title: 'Django Analytical middleware',
                message: `django-analytical is installed. Review which analytics services are configured and ensure consent is collected.`,
                file: filePath,
                line: i + 1,
                rule: 'tracker-middleware',
            });
        }
    }

    return findings;
}

// ─── Rust Scanning ─────────────────────────────────────────────

function scanRustFile(
    content: string,
    filePath: string,
    patterns: TrackerPatternDatabase,
): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // use statements
        const useMatch = line.match(/^\s*use\s+(\w+)/);
        if (useMatch) {
            const crate = useMatch[1].toLowerCase();
            for (const [cargo, match] of Object.entries(patterns.cargo)) {
                if (crate === cargo.toLowerCase().replace(/-/g, '_')) {
                    findings.push({
                        id: `code-rust-use-${match.vendorId}-${filePath}-${i}`,
                        category: 'code',
                        severity: match.severity,
                        title: `Tracker crate usage: ${cargo}`,
                        message: `Using crate "${cargo}" (${match.vendorId}).`,
                        file: filePath,
                        line: i + 1,
                        vendorId: match.vendorId,
                        rule: 'tracker-import',
                    });
                }
            }
        }

        // Check import patterns
        for (const ip of patterns.importPatterns) {
            if (ip.language === 'rust' && line.includes(ip.pattern)) {
                findings.push({
                    id: `code-rust-pattern-${ip.vendorId}-${filePath}-${i}`,
                    category: 'code',
                    severity: ip.severity,
                    title: `Tracker usage: ${ip.vendorId}`,
                    message: `Found "${ip.pattern}" in Rust source.`,
                    file: filePath,
                    line: i + 1,
                    vendorId: ip.vendorId,
                    rule: 'tracker-api-call',
                });
            }
        }
    }

    return findings;
}

// ─── Deduplication ─────────────────────────────────────────────

// ─── False Positive Filtering ──────────────────────────────────

function filterFalsePositives(findings: AuditFinding[]): AuditFinding[] {
    return findings.filter(f => {
        // Extract domain from finding message or vendor ID for pattern checking
        const domainHint = f.vendorId || '';
        const lineContent = f.message || '';

        // Check if the finding's domain matches a safe pattern
        const patternResult = checkPatterns(domainHint);

        // If it matches a safe pattern with high confidence, suppress
        if (patternResult.is_safe && patternResult.confidence > 0.8) {
            return false;
        }

        // Also check any domain-like strings in the message
        const domainMatch = lineContent.match(/(?:[\w-]+\.)+[\w-]+/);
        if (domainMatch) {
            const msgResult = checkPatterns(domainMatch[0]);
            if (msgResult.is_safe && msgResult.confidence > 0.8) {
                return false;
            }
        }

        return true;
    });
}

function deduplicateFindings(findings: AuditFinding[]): AuditFinding[] {
    const seen = new Set<string>();
    return findings.filter((f) => {
        // Dedupe by rule + vendor + file + line combination
        const key = `${f.rule}:${f.vendorId}:${f.file}:${f.line ?? ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
