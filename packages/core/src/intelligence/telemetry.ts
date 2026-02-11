// ─── Telemetry Module ─────────────────────────────────────────────
//
// Privacy-preserving, opt-in telemetry for ETALON.
// Only collects anonymous, aggregated usage data when explicitly
// enabled by the user. No PII is ever collected.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';

/** Read the ETALON version from the nearest package.json. */
function getVersion(): string {
    try {
        const pkgPath = join(dirname(new URL(import.meta.url).pathname), '../../package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        return pkg.version ?? 'unknown';
    } catch {
        return 'unknown';
    }
}

// ─── Types ────────────────────────────────────────────────────────

export interface TelemetryConfig {
    enabled: boolean;
    anonymous_id: string;
    first_seen: string;
    last_sent?: string;
}

export interface TelemetryEvent {
    event: string;
    timestamp: string;
    anonymous_id: string;
    properties: Record<string, string | number | boolean>;
}

// ─── Config Path ──────────────────────────────────────────────────

const CONFIG_DIR = join(homedir(), '.etalon');
const CONFIG_PATH = join(CONFIG_DIR, 'telemetry.json');

// ─── Config Management ───────────────────────────────────────────

function loadConfig(): TelemetryConfig {
    try {
        if (existsSync(CONFIG_PATH)) {
            return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
        }
    } catch { /* ignore */ }

    return {
        enabled: false,
        anonymous_id: randomUUID(),
        first_seen: new Date().toISOString(),
    };
}

function saveConfig(config: TelemetryConfig): void {
    try {
        if (!existsSync(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true });
        }
        writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    } catch { /* ignore */ }
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Check if telemetry is enabled.
 */
export function isTelemetryEnabled(): boolean {
    // Always check env var first (CI/CD override)
    if (process.env.ETALON_TELEMETRY === 'false' || process.env.DO_NOT_TRACK === '1') {
        return false;
    }
    return loadConfig().enabled;
}

/**
 * Enable telemetry (opt-in).
 */
export function enableTelemetry(): void {
    const config = loadConfig();
    config.enabled = true;
    saveConfig(config);
}

/**
 * Disable telemetry.
 */
export function disableTelemetry(): void {
    const config = loadConfig();
    config.enabled = false;
    saveConfig(config);
}

/**
 * Get telemetry status.
 */
export function getTelemetryStatus(): { enabled: boolean; anonymous_id: string } {
    const config = loadConfig();
    return { enabled: config.enabled, anonymous_id: config.anonymous_id };
}

/**
 * Record a telemetry event (only if enabled).
 * In the open-source version, events are stored locally.
 * A SaaS version could send them to a backend.
 */
export function recordEvent(event: string, properties: Record<string, string | number | boolean> = {}): void {
    if (!isTelemetryEnabled()) return;

    const config = loadConfig();
    const telEvent: TelemetryEvent = {
        event,
        timestamp: new Date().toISOString(),
        anonymous_id: config.anonymous_id,
        properties: {
            ...properties,
            // Strip any potential PII
            etalon_version: getVersion(),
        },
    };

    // Store locally (append mode)
    const eventsPath = join(CONFIG_DIR, 'events.jsonl');
    try {
        const line = JSON.stringify(telEvent) + '\n';
        writeFileSync(eventsPath, line, { encoding: 'utf-8', flag: 'a' });
    } catch { /* ignore */ }
}

/**
 * Record an audit event.
 */
export function recordAuditEvent(summary: {
    total_findings: number;
    critical: number;
    high: number;
    medium: number;
    framework?: string;
    industry?: string;
    region?: string;
}): void {
    recordEvent('audit_completed', {
        total_findings: summary.total_findings,
        critical: summary.critical,
        high: summary.high,
        medium: summary.medium,
        framework: summary.framework ?? 'unknown',
        industry: summary.industry ?? 'general',
        region: summary.region ?? 'unknown',
    });
}

/**
 * Record a fix applied event.
 */
export function recordFixEvent(tracker_id: string, framework: string): void {
    recordEvent('fix_applied', { tracker_id, framework });
}

/**
 * Get locally stored events (for debugging or export).
 */
export function getStoredEvents(): TelemetryEvent[] {
    const eventsPath = join(CONFIG_DIR, 'events.jsonl');
    try {
        if (!existsSync(eventsPath)) return [];
        const content = readFileSync(eventsPath, 'utf-8');
        return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
    } catch {
        return [];
    }
}
