import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StackInfo, Language, Framework, ORM } from './types.js';

/**
 * Auto-detect the project stack from filesystem presence.
 */
export function detectStack(directory: string): StackInfo {
    const languages: Language[] = [];
    let framework: Framework = 'none';
    let orm: ORM = 'none';
    let packageManager: StackInfo['packageManager'] = 'unknown';
    const detectedFiles: string[] = [];

    // ─── JavaScript / TypeScript ─────────────────────────────────

    const packageJsonPath = join(directory, 'package.json');
    if (existsSync(packageJsonPath)) {
        languages.push('javascript');
        detectedFiles.push('package.json');

        // Detect package manager
        if (existsSync(join(directory, 'pnpm-lock.yaml'))) {
            packageManager = 'pnpm';
        } else if (existsSync(join(directory, 'yarn.lock'))) {
            packageManager = 'yarn';
        } else {
            packageManager = 'npm';
        }

        // Check for TypeScript
        if (
            existsSync(join(directory, 'tsconfig.json')) ||
            existsSync(join(directory, 'tsconfig.base.json'))
        ) {
            if (!languages.includes('typescript')) languages.push('typescript');
            detectedFiles.push('tsconfig.json');
        }

        // Parse package.json for framework + ORM detection
        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const allDeps = {
                ...pkg.dependencies,
                ...pkg.devDependencies,
            };

            // Framework detection
            if (allDeps['next']) {
                framework = 'nextjs';
                detectedFiles.push('next.config.*');
            } else if (allDeps['nuxt'] || allDeps['nuxt3']) {
                framework = 'nuxt';
            } else if (allDeps['@sveltejs/kit'] || allDeps['svelte']) {
                framework = 'svelte';
            } else if (allDeps['fastify']) {
                framework = 'fastify';
            } else if (allDeps['express']) {
                framework = 'express';
            }

            // ORM detection
            if (allDeps['prisma'] || allDeps['@prisma/client']) {
                orm = 'prisma';
            } else if (allDeps['typeorm']) {
                orm = 'typeorm';
            } else if (allDeps['drizzle-orm']) {
                orm = 'drizzle';
            } else if (allDeps['sequelize']) {
                orm = 'sequelize';
            }
        } catch {
            // Ignore parse errors
        }
    }

    // ─── Python ──────────────────────────────────────────────────

    const pyprojectPath = join(directory, 'pyproject.toml');
    const requirementsPath = join(directory, 'requirements.txt');
    const pipfilePath = join(directory, 'Pipfile');

    if (existsSync(pyprojectPath) || existsSync(requirementsPath) || existsSync(pipfilePath)) {
        if (!languages.includes('python')) languages.push('python');

        if (existsSync(pyprojectPath)) {
            detectedFiles.push('pyproject.toml');
            packageManager = 'poetry';
        } else if (existsSync(requirementsPath)) {
            detectedFiles.push('requirements.txt');
            packageManager = 'pip';
        }

        // Detect Python framework from dependencies
        const pyDeps = readPythonDeps(directory);

        if (pyDeps.has('django')) {
            framework = 'django';
            orm = 'django-orm';
        } else if (pyDeps.has('fastapi')) {
            framework = 'fastapi';
        } else if (pyDeps.has('flask')) {
            framework = 'flask';
        }

        if (pyDeps.has('sqlalchemy') || pyDeps.has('flask-sqlalchemy')) {
            orm = 'sqlalchemy';
        }

        // Django manage.py
        if (existsSync(join(directory, 'manage.py'))) {
            framework = 'django';
            orm = 'django-orm';
            detectedFiles.push('manage.py');
        }
    }

    // ─── Rust ────────────────────────────────────────────────────

    const cargoPath = join(directory, 'Cargo.toml');
    if (existsSync(cargoPath)) {
        if (!languages.includes('rust')) languages.push('rust');
        detectedFiles.push('Cargo.toml');
        packageManager = 'cargo';

        try {
            const cargoContent = readFileSync(cargoPath, 'utf-8');

            if (cargoContent.includes('actix-web')) {
                framework = 'actix';
            } else if (cargoContent.includes('axum')) {
                framework = 'axum';
            } else if (cargoContent.includes('rocket')) {
                framework = 'rocket';
            }

            if (cargoContent.includes('diesel')) {
                orm = 'diesel';
            } else if (cargoContent.includes('sea-orm')) {
                orm = 'sea-orm';
            }
        } catch {
            // Ignore parse errors
        }
    }

    // Default language
    if (languages.length === 0) {
        languages.push('unknown');
    }

    return {
        languages,
        framework,
        orm,
        packageManager,
        detectedFiles,
    };
}

/**
 * Read Python dependencies from requirements.txt or pyproject.toml.
 */
function readPythonDeps(directory: string): Set<string> {
    const deps = new Set<string>();

    // requirements.txt
    const reqPath = join(directory, 'requirements.txt');
    if (existsSync(reqPath)) {
        const content = readFileSync(reqPath, 'utf-8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
                // Extract package name (before ==, >=, etc.)
                const name = trimmed.split(/[=><~![\s]/)[0].toLowerCase();
                if (name) deps.add(name);
            }
        }
    }

    // pyproject.toml — rough parse for [project.dependencies] or [tool.poetry.dependencies]
    const pyprojectPath = join(directory, 'pyproject.toml');
    if (existsSync(pyprojectPath)) {
        const content = readFileSync(pyprojectPath, 'utf-8');
        // Match quoted dependency names
        const matches = content.matchAll(/["']([a-zA-Z0-9_-]+)["']/g);
        for (const match of matches) {
            deps.add(match[1].toLowerCase());
        }
    }

    return deps;
}
