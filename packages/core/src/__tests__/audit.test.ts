import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { detectStack } from '../audit/stack-detector.js';
import { scanCode } from '../audit/code-scanner.js';
import { scanSchemas } from '../audit/schema-scanner.js';
import { scanConfigs } from '../audit/config-scanner.js';
import type { TrackerPatternDatabase, StackInfo } from '../audit/types.js';

// ─── Minimal tracker patterns for testing ──────────────────────

const TEST_PATTERNS: TrackerPatternDatabase = {
    npm: {
        'react-ga4': { vendorId: 'google-analytics', severity: 'medium' },
        '@sentry/browser': { vendorId: 'sentry', severity: 'low' },
        'posthog-js': { vendorId: 'posthog', severity: 'medium' },
    },
    pypi: {
        'sentry-sdk': { vendorId: 'sentry', severity: 'low' },
        'django-analytical': { vendorId: 'google-analytics', severity: 'medium' },
    },
    cargo: {
        'sentry': { vendorId: 'sentry', severity: 'low' },
    },
    envVars: {
        'GA_TRACKING_ID': { vendorId: 'google-analytics', severity: 'info' },
        'SENTRY_DSN': { vendorId: 'sentry', severity: 'info' },
    },
    htmlPatterns: [
        { pattern: 'googletagmanager.com/gtag/js', vendorId: 'google-analytics', severity: 'medium' },
        { pattern: 'connect.facebook.net/en_US/fbevents.js', vendorId: 'facebook-pixel', severity: 'high' },
    ],
    importPatterns: [
        { pattern: 'import sentry_sdk', language: 'python', vendorId: 'sentry', severity: 'low' },
        { pattern: 'use sentry', language: 'rust', vendorId: 'sentry', severity: 'low' },
    ],
};

// ─── Test fixture directory ────────────────────────────────────

const FIXTURE_DIR = join(__dirname, '__fixtures_audit__');

function createFixture(path: string, content: string): string {
    const fullPath = join(FIXTURE_DIR, path);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, content, 'utf-8');
    return fullPath;
}

beforeAll(() => {
    mkdirSync(FIXTURE_DIR, { recursive: true });
});

afterAll(() => {
    rmSync(FIXTURE_DIR, { recursive: true, force: true });
});

// ─── Stack Detection Tests ─────────────────────────────────────

describe('Stack Detector', () => {
    it('should detect JavaScript/TypeScript with Next.js', () => {
        const dir = join(FIXTURE_DIR, 'nextjs-project');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            dependencies: { next: '14.0.0', react: '18.0.0' },
        }));
        writeFileSync(join(dir, 'tsconfig.json'), '{}');
        writeFileSync(join(dir, 'next.config.js'), 'module.exports = {}');

        const stack = detectStack(dir);
        expect(stack.languages).toContain('javascript');
        expect(stack.languages).toContain('typescript');
        expect(stack.framework).toBe('nextjs');
        expect(stack.packageManager).toBe('npm');
    });

    it('should detect Python with Django', () => {
        const dir = join(FIXTURE_DIR, 'django-project');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'requirements.txt'), 'django==4.2\ncelery\n');
        writeFileSync(join(dir, 'manage.py'), '#!/usr/bin/env python\n');

        const stack = detectStack(dir);
        expect(stack.languages).toContain('python');
        expect(stack.framework).toBe('django');
        expect(stack.orm).toBe('django-orm');
    });

    it('should detect Rust with Actix', () => {
        const dir = join(FIXTURE_DIR, 'rust-project');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'Cargo.toml'), '[dependencies]\nactix-web = "4"\ndiesel = { version = "2.0" }\n');

        const stack = detectStack(dir);
        expect(stack.languages).toContain('rust');
        expect(stack.framework).toBe('actix');
        expect(stack.orm).toBe('diesel');
        expect(stack.packageManager).toBe('cargo');
    });

    it('should detect Prisma ORM', () => {
        const dir = join(FIXTURE_DIR, 'prisma-project');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            dependencies: { express: '4.18.0', '@prisma/client': '5.0.0' },
        }));

        const stack = detectStack(dir);
        expect(stack.framework).toBe('express');
        expect(stack.orm).toBe('prisma');
    });
});

// ─── Code Scanner Tests ────────────────────────────────────────

describe('Code Scanner', () => {
    it('should detect tracker imports in JS', () => {
        const file = createFixture('code/tracker.ts', `
import ReactGA from 'react-ga4';
import * as Sentry from '@sentry/browser';
ReactGA.initialize('G-XXXXX');
`);

        const stack: StackInfo = { languages: ['typescript'], framework: 'none', orm: 'none', packageManager: 'npm', detectedFiles: [] };
        const findings = scanCode([file], FIXTURE_DIR, stack, TEST_PATTERNS);

        const gaImport = findings.find(f => f.vendorId === 'google-analytics' && f.rule === 'tracker-import');
        expect(gaImport).toBeDefined();
        const sentryImport = findings.find(f => f.vendorId === 'sentry' && f.rule === 'tracker-import');
        expect(sentryImport).toBeDefined();
    });

    it('should detect tracker env vars', () => {
        const file = createFixture('code/.env', `
GA_TRACKING_ID=UA-12345
SENTRY_DSN=https://abc@sentry.io/123
DATABASE_URL=postgres://localhost/db
`);

        const stack: StackInfo = { languages: ['javascript'], framework: 'none', orm: 'none', packageManager: 'npm', detectedFiles: [] };
        const findings = scanCode([file], FIXTURE_DIR, stack, TEST_PATTERNS);

        expect(findings.some(f => f.vendorId === 'google-analytics')).toBe(true);
        expect(findings.some(f => f.vendorId === 'sentry')).toBe(true);
        expect(findings.some(f => f.rule === 'tracker-env-var')).toBe(true);
    });

    it('should detect hardcoded tracking pixels in HTML', () => {
        const file = createFixture('code/index.html', `
<!DOCTYPE html>
<html>
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
  <script>
    !function(f,b,e,v,n,t,s){...}(window, document,'script','connect.facebook.net/en_US/fbevents.js');
  </script>
</head>
</html>
`);

        const stack: StackInfo = { languages: ['javascript'], framework: 'none', orm: 'none', packageManager: 'npm', detectedFiles: [] };
        const findings = scanCode([file], FIXTURE_DIR, stack, TEST_PATTERNS);

        expect(findings.some(f => f.vendorId === 'google-analytics' && f.rule === 'hardcoded-tracker')).toBe(true);
        expect(findings.some(f => f.vendorId === 'facebook-pixel')).toBe(true);
    });

    it('should detect cookie writes without consent', () => {
        const file = createFixture('code/tracking.js', `
function trackUser() {
  document.cookie = "user_id=123; path=/";
}
`);

        const stack: StackInfo = { languages: ['javascript'], framework: 'none', orm: 'none', packageManager: 'npm', detectedFiles: [] };
        const findings = scanCode([file], FIXTURE_DIR, stack, TEST_PATTERNS);

        expect(findings.some(f => f.rule === 'cookie-no-consent')).toBe(true);
    });

    it('should detect PII in localStorage', () => {
        const file = createFixture('code/storage.js', `
function login(user) {
  localStorage.setItem('user_email', user.email);
}
`);

        const stack: StackInfo = { languages: ['javascript'], framework: 'none', orm: 'none', packageManager: 'npm', detectedFiles: [] };
        const findings = scanCode([file], FIXTURE_DIR, stack, TEST_PATTERNS);

        expect(findings.some(f => f.rule === 'storage-pii')).toBe(true);
    });
});

// ─── Schema Scanner Tests ──────────────────────────────────────

describe('Schema Scanner', () => {
    it('should detect PII in Prisma schema', () => {
        const file = createFixture('schema/schema.prisma', `
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  phone     String?
  name      String
  password  String
  createdAt DateTime @default(now())
}
`);

        const stack: StackInfo = { languages: ['typescript'], framework: 'none', orm: 'prisma', packageManager: 'npm', detectedFiles: [] };
        const findings = scanSchemas([file], FIXTURE_DIR, stack);

        expect(findings.some(f => f.title.includes('email'))).toBe(true);
        expect(findings.some(f => f.title.includes('phone'))).toBe(true);
        expect(findings.some(f => f.title.includes('password'))).toBe(true);
        expect(findings.some(f => f.rule === 'no-retention-policy')).toBe(true);
    });

    it('should detect PII in SQL migrations', () => {
        const file = createFixture('schema/migration.sql', `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address INET,
  ssn VARCHAR(11),
  created_at TIMESTAMP DEFAULT now()
);
`);

        const stack: StackInfo = { languages: ['javascript'], framework: 'none', orm: 'none', packageManager: 'npm', detectedFiles: [] };
        const findings = scanSchemas([file], FIXTURE_DIR, stack);

        expect(findings.some(f => f.title.includes('email'))).toBe(true);
        expect(findings.some(f => f.title.includes('ip_address'))).toBe(true);
        expect(findings.some(f => f.severity === 'critical')).toBe(true); // SSN
    });

    it('should detect PII in Django models', () => {
        const file = createFixture('schema/models.py', `
from django.db import models

class UserProfile(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=20)
    date_of_birth = models.DateField()
    ip_address = models.GenericIPAddressField()
`);

        const stack: StackInfo = { languages: ['python'], framework: 'django', orm: 'django-orm', packageManager: 'pip', detectedFiles: [] };
        const findings = scanSchemas([file], FIXTURE_DIR, stack);

        expect(findings.some(f => f.title.includes('phone'))).toBe(true);
        expect(findings.some(f => f.title.includes('GenericIPAddressField'))).toBe(true);
    });
});

// ─── Config Scanner Tests ──────────────────────────────────────

describe('Config Scanner', () => {
    it('should detect CORS wildcard', () => {
        const file = createFixture('config/server.js', `
const cors = require('cors');
app.use(cors({
  origin: '*',
  credentials: true
}));
`);

        const stack: StackInfo = { languages: ['javascript'], framework: 'express', orm: 'none', packageManager: 'npm', detectedFiles: [] };
        const findings = scanConfigs([file], FIXTURE_DIR, stack);

        expect(findings.some(f => f.rule === 'cors-wildcard')).toBe(true);
    });

    it('should detect Django insecure settings', () => {
        const dir = join(FIXTURE_DIR, 'django-config');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'settings.py'), `
DEBUG = True
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_SAMESITE = None
`);

        const stack: StackInfo = { languages: ['python'], framework: 'django', orm: 'django-orm', packageManager: 'pip', detectedFiles: [] };
        const findings = scanConfigs([], dir, stack);

        expect(findings.some(f => f.rule === 'debug-mode')).toBe(true);
        expect(findings.some(f => f.rule === 'cookie-insecure')).toBe(true);
    });

    it('should detect PII in logs', () => {
        const file = createFixture('config/logging.js', `
function handleLogin(email, password) {
  console.log("Login attempt for email:", email);
}
`);

        const stack: StackInfo = { languages: ['javascript'], framework: 'express', orm: 'none', packageManager: 'npm', detectedFiles: [] };
        const findings = scanConfigs([file], FIXTURE_DIR, stack);

        expect(findings.some(f => f.rule === 'logging-pii')).toBe(true);
    });
});
