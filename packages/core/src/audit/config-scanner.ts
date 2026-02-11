import { readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { AuditFinding, StackInfo } from './types.js';

/**
 * Scan configuration files for privacy/security issues.
 */
export function scanConfigs(
    files: string[],
    baseDir: string,
    stack: StackInfo,
): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Framework-specific config scanning
    findings.push(...scanFrameworkConfig(baseDir, stack));

    // Scan individual source files for config issues
    for (const filePath of files) {
        try {
            const content = readFileSync(filePath, 'utf-8');
            const relPath = relative(baseDir, filePath);

            // Cookie configuration issues
            findings.push(...scanCookieConfig(content, relPath, stack));

            // CORS configuration
            findings.push(...scanCorsConfig(content, relPath));

            // CSP headers
            findings.push(...scanCspConfig(content, relPath));

            // Logging PII
            findings.push(...scanLoggingConfig(content, relPath));

        } catch {
            // Skip
        }
    }

    return findings;
}

// ─── Framework-Specific Config ─────────────────────────────────

function scanFrameworkConfig(baseDir: string, stack: StackInfo): AuditFinding[] {
    const findings: AuditFinding[] = [];

    switch (stack.framework) {
        case 'nextjs':
            findings.push(...scanNextjsConfig(baseDir));
            break;
        case 'django':
            findings.push(...scanDjangoConfig(baseDir));
            break;
        case 'express':
        case 'fastify':
            findings.push(...scanExpressConfig(baseDir));
            break;
        case 'flask':
            findings.push(...scanFlaskConfig(baseDir));
            break;
    }

    return findings;
}

// ─── Next.js ───────────────────────────────────────────────────

function scanNextjsConfig(baseDir: string): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Check next.config.js/ts/mjs
    for (const ext of ['.js', '.ts', '.mjs']) {
        const configPath = join(baseDir, `next.config${ext}`);
        if (!existsSync(configPath)) continue;

        const content = readFileSync(configPath, 'utf-8');

        // Security headers
        if (!content.includes('headers') || !content.includes('Content-Security-Policy')) {
            findings.push({
                id: 'config-nextjs-no-csp',
                category: 'config',
                severity: 'medium',
                title: 'No Content-Security-Policy in Next.js config',
                message: 'next.config does not set CSP headers. A CSP helps prevent unauthorized tracker injection via XSS.',
                file: `next.config${ext}`,
                rule: 'missing-csp',
                fix: 'Add security headers in next.config.js headers() function.',
            });
        }

        // Check for analytics rewrites (proxied analytics)
        if (content.includes('google-analytics.com') || content.includes('googletagmanager.com')) {
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('google-analytics.com') || lines[i].includes('googletagmanager.com')) {
                    findings.push({
                        id: `config-nextjs-proxy-analytics-${i}`,
                        category: 'config',
                        severity: 'high',
                        title: 'Analytics proxy in Next.js rewrites',
                        message: 'Proxying analytics through Next.js rewrites can circumvent ad blockers but may violate GDPR transparency requirements.',
                        file: `next.config${ext}`,
                        line: i + 1,
                        vendorId: 'google-analytics',
                        rule: 'analytics-proxy',
                    });
                }
            }
        }
    }

    // Check _app.tsx or layout.tsx for unconditional tracker loading
    const appFiles = ['src/pages/_app.tsx', 'src/pages/_app.jsx', 'src/app/layout.tsx', 'src/app/layout.jsx', 'pages/_app.tsx', 'pages/_app.jsx', 'app/layout.tsx', 'app/layout.jsx'];
    for (const appFile of appFiles) {
        const appPath = join(baseDir, appFile);
        if (!existsSync(appPath)) continue;

        const content = readFileSync(appPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            // Check for Google Analytics or GTM loaded without consent
            if (lines[i].includes('GoogleAnalytics') || lines[i].includes('GoogleTagManager') || lines[i].includes('next/script') && lines[i].includes('gtag')) {
                // Check if there's a consent guard
                const contextStart = Math.max(0, i - 5);
                const context = lines.slice(contextStart, i + 3).join('\n').toLowerCase();
                if (!context.includes('consent') && !context.includes('cookie') && !context.includes('gdpr')) {
                    findings.push({
                        id: `config-nextjs-unconditional-tracker-${appFile}-${i}`,
                        category: 'config',
                        severity: 'high',
                        title: 'Tracker loaded unconditionally in app layout',
                        message: `Analytics/tracking script loaded without consent check in ${appFile}. GDPR requires consent before non-essential tracking.`,
                        file: appFile,
                        line: i + 1,
                        rule: 'unconditional-tracker',
                        fix: 'Wrap tracker initialization in a consent check.',
                    });
                }
            }
        }
    }

    return findings;
}

// ─── Django ────────────────────────────────────────────────────

function scanDjangoConfig(baseDir: string): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Find settings.py
    const settingsPaths = ['settings.py', 'settings/base.py', 'settings/production.py', 'config/settings.py'];
    for (const settingsFile of settingsPaths) {
        const settingsPath = join(baseDir, settingsFile);
        if (!existsSync(settingsPath)) continue;

        const content = readFileSync(settingsPath, 'utf-8');
        const lines = content.split('\n');

        // SESSION_COOKIE_SECURE
        if (!content.includes('SESSION_COOKIE_SECURE') || content.includes('SESSION_COOKIE_SECURE = False')) {
            findings.push({
                id: `config-django-session-insecure-${settingsFile}`,
                category: 'config',
                severity: 'high',
                title: 'Django session cookie not marked Secure',
                message: 'SESSION_COOKIE_SECURE should be True in production to prevent session hijacking over HTTP.',
                file: settingsFile,
                rule: 'cookie-insecure',
                fix: 'Set SESSION_COOKIE_SECURE = True',
            });
        }

        // CSRF_COOKIE_HTTPONLY
        if (content.includes('CSRF_COOKIE_HTTPONLY = False')) {
            findings.push({
                id: `config-django-csrf-httponly-${settingsFile}`,
                category: 'config',
                severity: 'medium',
                title: 'Django CSRF cookie HttpOnly disabled',
                message: 'CSRF_COOKIE_HTTPONLY = False exposes the CSRF token to JavaScript.',
                file: settingsFile,
                rule: 'cookie-insecure',
            });
        }

        // SESSION_COOKIE_SAMESITE
        if (!content.includes('SESSION_COOKIE_SAMESITE') || content.includes("SESSION_COOKIE_SAMESITE = 'None'") || content.includes('SESSION_COOKIE_SAMESITE = None')) {
            findings.push({
                id: `config-django-samesite-${settingsFile}`,
                category: 'config',
                severity: 'medium',
                title: 'Django session cookie SameSite not set',
                message: 'SESSION_COOKIE_SAMESITE should be "Lax" or "Strict" to prevent CSRF and limit third-party cookie sharing.',
                file: settingsFile,
                rule: 'cookie-samesite',
                fix: "Set SESSION_COOKIE_SAMESITE = 'Lax'",
            });
        }

        // DEBUG mode check
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/^\s*DEBUG\s*=\s*True/)) {
                findings.push({
                    id: `config-django-debug-${settingsFile}`,
                    category: 'config',
                    severity: 'high',
                    title: 'Django DEBUG = True',
                    message: 'DEBUG mode enabled — this leaks detailed error info including PII in stack traces to users.',
                    file: settingsFile,
                    line: i + 1,
                    rule: 'debug-mode',
                });
            }
        }

        // SECURE_SSL_REDIRECT
        if (!content.includes('SECURE_SSL_REDIRECT') || content.includes('SECURE_SSL_REDIRECT = False')) {
            findings.push({
                id: `config-django-no-ssl-${settingsFile}`,
                category: 'config',
                severity: 'medium',
                title: 'Django SSL redirect not enabled',
                message: 'SECURE_SSL_REDIRECT should be True to enforce HTTPS.',
                file: settingsFile,
                rule: 'no-ssl',
            });
        }
    }

    return findings;
}

// ─── Express / Fastify ─────────────────────────────────────────

function scanExpressConfig(baseDir: string): AuditFinding[] {
    const findings: AuditFinding[] = [];

    // Check for helmet usage (security headers)
    try {
        const pkg = JSON.parse(readFileSync(join(baseDir, 'package.json'), 'utf-8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (!allDeps['helmet']) {
            findings.push({
                id: 'config-express-no-helmet',
                category: 'config',
                severity: 'medium',
                title: 'Express app missing Helmet',
                message: 'Helmet sets security headers (CSP, X-Frame-Options, etc.) that help prevent tracker injection via XSS.',
                file: 'package.json',
                rule: 'missing-security-headers',
                fix: 'npm install helmet && app.use(helmet())',
            });
        }
    } catch {
        // Skip
    }

    return findings;
}

// ─── Flask ─────────────────────────────────────────────────────

function scanFlaskConfig(baseDir: string): AuditFinding[] {
    const findings: AuditFinding[] = [];

    const configFiles = ['config.py', 'app.py', 'settings.py'];
    for (const configFile of configFiles) {
        const configPath = join(baseDir, configFile);
        if (!existsSync(configPath)) continue;

        const content = readFileSync(configPath, 'utf-8');
        const lines = content.split('\n');

        // SESSION_COOKIE_SECURE
        if (content.includes('SESSION_COOKIE_SECURE') && content.includes('False')) {
            findings.push({
                id: `config-flask-session-insecure-${configFile}`,
                category: 'config',
                severity: 'high',
                title: 'Flask session cookie not secure',
                message: 'SESSION_COOKIE_SECURE should be True in production.',
                file: configFile,
                rule: 'cookie-insecure',
            });
        }

        // Debug mode
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/DEBUG\s*=\s*True/) || lines[i].includes('app.run(debug=True)')) {
                findings.push({
                    id: `config-flask-debug-${configFile}-${i}`,
                    category: 'config',
                    severity: 'high',
                    title: 'Flask debug mode enabled',
                    message: 'Debug mode leaks stack traces and PII to users.',
                    file: configFile,
                    line: i + 1,
                    rule: 'debug-mode',
                });
            }
        }
    }

    return findings;
}

// ─── Cookie Configuration Scanning ─────────────────────────────

function scanCookieConfig(content: string, filePath: string, _stack: StackInfo): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Express/Connect cookie-session or express-session config
        if (line.includes('cookie:') && i + 5 < lines.length) {
            const cookieBlock = lines.slice(i, i + 8).join('\n');

            if (!cookieBlock.includes('secure')) {
                findings.push({
                    id: `config-cookie-no-secure-${filePath}-${i}`,
                    category: 'config',
                    severity: 'high',
                    title: 'Cookie missing Secure flag',
                    message: 'Cookie configuration does not set secure: true. Cookies will be sent over HTTP.',
                    file: filePath,
                    line: i + 1,
                    rule: 'cookie-insecure',
                    fix: 'Add secure: true to cookie options',
                });
            }

            if (!cookieBlock.includes('sameSite') && !cookieBlock.includes('same_site')) {
                findings.push({
                    id: `config-cookie-no-samesite-${filePath}-${i}`,
                    category: 'config',
                    severity: 'medium',
                    title: 'Cookie missing SameSite attribute',
                    message: 'Cookie does not set SameSite attribute. Set to "Lax" or "Strict" to prevent CSRF.',
                    file: filePath,
                    line: i + 1,
                    rule: 'cookie-samesite',
                    fix: "Add sameSite: 'lax' to cookie options",
                });
            }
        }
    }

    return findings;
}

// ─── CORS Configuration Scanning ───────────────────────────────

function scanCorsConfig(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // CORS wildcard
        if (
            (line.includes("origin: '*'") || line.includes('origin: "*"') || line.includes("origin: true")) ||
            (line.includes('CORS_ALLOW_ALL_ORIGINS') && line.includes('True')) ||
            (line.includes('Access-Control-Allow-Origin') && line.includes('*'))
        ) {
            findings.push({
                id: `config-cors-wildcard-${filePath}-${i}`,
                category: 'config',
                severity: 'medium',
                title: 'CORS wildcard origin',
                message: 'CORS is configured to allow all origins. This can expose user data to any domain.',
                file: filePath,
                line: i + 1,
                rule: 'cors-wildcard',
                fix: 'Restrict CORS to specific trusted origins.',
            });
        }

        // CORS with credentials and wildcard
        if (line.includes('credentials') && line.includes('true')) {
            const block = lines.slice(Math.max(0, i - 5), i + 5).join('\n');
            if (block.includes("'*'") || block.includes('"*"')) {
                findings.push({
                    id: `config-cors-credentials-wildcard-${filePath}-${i}`,
                    category: 'config',
                    severity: 'high',
                    title: 'CORS credentials with wildcard origin',
                    message: 'CORS allows credentials with wildcard origin — this is a security vulnerability.',
                    file: filePath,
                    line: i + 1,
                    rule: 'cors-credentials-wildcard',
                });
            }
        }
    }

    return findings;
}

// ─── CSP Configuration Scanning ────────────────────────────────

function scanCspConfig(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // CSP with unsafe-inline or unsafe-eval
        if (line.includes('Content-Security-Policy') || line.includes('contentSecurityPolicy')) {
            const cspBlock = lines.slice(i, Math.min(lines.length, i + 10)).join('\n');

            if (cspBlock.includes("'unsafe-inline'")) {
                findings.push({
                    id: `config-csp-unsafe-inline-${filePath}-${i}`,
                    category: 'config',
                    severity: 'medium',
                    title: "CSP allows 'unsafe-inline'",
                    message: "Content-Security-Policy uses 'unsafe-inline' which allows injected tracker scripts to execute.",
                    file: filePath,
                    line: i + 1,
                    rule: 'csp-unsafe-inline',
                });
            }

            if (cspBlock.includes("'unsafe-eval'")) {
                findings.push({
                    id: `config-csp-unsafe-eval-${filePath}-${i}`,
                    category: 'config',
                    severity: 'high',
                    title: "CSP allows 'unsafe-eval'",
                    message: "Content-Security-Policy uses 'unsafe-eval' which enables arbitrary script execution.",
                    file: filePath,
                    line: i + 1,
                    rule: 'csp-unsafe-eval',
                });
            }
        }
    }

    return findings;
}

// ─── Logging PII Scanning ──────────────────────────────────────

function scanLoggingConfig(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    const piiLogPatterns = [
        /console\.log\(.*(?:email|password|token|ssn|phone|ip_address)/i,
        /logger\.\w+\(.*(?:email|password|token|ssn|phone)/i,
        /logging\.\w+\(.*(?:email|password|token|ssn|phone)/i,
        /print\(.*(?:email|password|token|ssn|phone)/i,
        /log::\w+!\(.*(?:email|password|token|ssn|phone)/i,
    ];

    for (let i = 0; i < lines.length; i++) {
        for (const pattern of piiLogPatterns) {
            if (pattern.test(lines[i])) {
                findings.push({
                    id: `config-log-pii-${filePath}-${i}`,
                    category: 'config',
                    severity: 'medium',
                    title: 'Logging potentially sensitive data',
                    message: 'Log statement appears to include PII (email, password, token, etc.). Avoid logging sensitive data.',
                    file: filePath,
                    line: i + 1,
                    rule: 'logging-pii',
                    fix: 'Remove PII from log statements or mask sensitive values.',
                });
                break;
            }
        }
    }

    return findings;
}
