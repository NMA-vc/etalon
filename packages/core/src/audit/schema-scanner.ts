import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import type { AuditFinding, StackInfo, PiiColumnPattern, FindingSeverity } from './types.js';

// ─── PII Column Patterns ───────────────────────────────────────

const PII_PATTERNS: PiiColumnPattern[] = [
    // Direct identifiers
    { pattern: 'email', piiType: 'email address', severity: 'high', recommendation: 'Hash or encrypt email addresses at rest' },
    { pattern: 'e_mail', piiType: 'email address', severity: 'high', recommendation: 'Hash or encrypt email addresses at rest' },
    { pattern: 'phone', piiType: 'phone number', severity: 'high', recommendation: 'Encrypt phone numbers and limit access' },
    { pattern: 'telephone', piiType: 'phone number', severity: 'high', recommendation: 'Encrypt phone numbers and limit access' },
    { pattern: 'mobile', piiType: 'phone number', severity: 'high', recommendation: 'Encrypt phone numbers and limit access' },
    { pattern: 'ssn', piiType: 'social security number', severity: 'critical', recommendation: 'Never store SSN in plaintext — hash or use tokenization' },
    { pattern: 'social_security', piiType: 'social security number', severity: 'critical', recommendation: 'Never store SSN in plaintext — hash or use tokenization' },
    { pattern: 'national_id', piiType: 'national ID', severity: 'critical', recommendation: 'Encrypt national ID numbers' },
    { pattern: 'passport', piiType: 'passport number', severity: 'critical', recommendation: 'Encrypt passport numbers' },
    { pattern: 'drivers_license', piiType: 'drivers license', severity: 'critical', recommendation: 'Encrypt license numbers' },
    { pattern: 'tax_id', piiType: 'tax ID', severity: 'critical', recommendation: 'Encrypt tax identification numbers' },

    // Names
    { pattern: 'first_name', piiType: 'personal name', severity: 'medium', recommendation: 'Consider whether full names need to be stored' },
    { pattern: 'last_name', piiType: 'personal name', severity: 'medium', recommendation: 'Consider whether full names need to be stored' },
    { pattern: 'full_name', piiType: 'personal name', severity: 'medium', recommendation: 'Consider whether full names need to be stored' },
    { pattern: 'display_name', piiType: 'personal name', severity: 'low', recommendation: 'Display names are PII — document in privacy policy' },

    // Location
    { pattern: 'address', piiType: 'physical address', severity: 'high', recommendation: 'Encrypt addresses and limit retention' },
    { pattern: 'street', piiType: 'physical address', severity: 'high', recommendation: 'Encrypt addresses' },
    { pattern: 'zip_code', piiType: 'location data', severity: 'medium', recommendation: 'Truncate zip codes for analytics (first 3 digits)' },
    { pattern: 'postal_code', piiType: 'location data', severity: 'medium', recommendation: 'Truncate postal codes' },
    { pattern: 'latitude', piiType: 'geolocation', severity: 'high', recommendation: 'Reduce precision for analytics, encrypt for storage' },
    { pattern: 'longitude', piiType: 'geolocation', severity: 'high', recommendation: 'Reduce precision for analytics' },
    { pattern: 'geolocation', piiType: 'geolocation', severity: 'high', recommendation: 'Reduce precision and encrypt' },

    // Network identifiers
    { pattern: 'ip_address', piiType: 'IP address', severity: 'high', recommendation: 'Anonymize IP addresses (zero last octet) or hash them' },
    { pattern: 'ip_addr', piiType: 'IP address', severity: 'high', recommendation: 'Anonymize IP addresses' },
    { pattern: 'client_ip', piiType: 'IP address', severity: 'high', recommendation: 'Anonymize IP addresses' },
    { pattern: 'remote_addr', piiType: 'IP address', severity: 'high', recommendation: 'Anonymize IP addresses' },
    { pattern: 'user_agent', piiType: 'browser fingerprint', severity: 'medium', recommendation: 'Consider truncating user agent strings' },
    { pattern: 'device_id', piiType: 'device identifier', severity: 'high', recommendation: 'Hash device IDs' },
    { pattern: 'fingerprint', piiType: 'browser fingerprint', severity: 'high', recommendation: 'Avoid storing browser fingerprints' },
    { pattern: 'mac_address', piiType: 'hardware identifier', severity: 'high', recommendation: 'Hash MAC addresses' },

    // Date of birth / age
    { pattern: 'date_of_birth', piiType: 'date of birth', severity: 'high', recommendation: 'Store only age or year of birth if possible' },
    { pattern: 'dob', piiType: 'date of birth', severity: 'high', recommendation: 'Store only age or year of birth if possible' },
    { pattern: 'birth_date', piiType: 'date of birth', severity: 'high', recommendation: 'Store only age or year of birth' },

    // Financial
    { pattern: 'credit_card', piiType: 'payment card', severity: 'critical', recommendation: 'Never store credit card numbers — use tokenization (Stripe, etc.)' },
    { pattern: 'card_number', piiType: 'payment card', severity: 'critical', recommendation: 'Never store card numbers — use a payment processor' },
    { pattern: 'bank_account', piiType: 'bank account', severity: 'critical', recommendation: 'Encrypt bank details, use payment processor tokenization' },
    { pattern: 'iban', piiType: 'bank identifier', severity: 'critical', recommendation: 'Encrypt IBAN numbers' },

    // Passwords / secrets
    { pattern: 'password', piiType: 'credential', severity: 'critical', recommendation: 'Passwords must be hashed (bcrypt/argon2), never stored in plaintext' },
    { pattern: 'secret', piiType: 'credential', severity: 'high', recommendation: 'Secrets should be hashed or encrypted' },
];

/**
 * Scan database schema files for PII storage patterns.
 */
export function scanSchemas(
    files: string[],
    baseDir: string,
    stack: StackInfo,
): AuditFinding[] {
    const findings: AuditFinding[] = [];

    for (const filePath of files) {
        try {
            const content = readFileSync(filePath, 'utf-8');
            const relPath = relative(baseDir, filePath);

            // Prisma schema
            if (filePath.endsWith('.prisma')) {
                findings.push(...scanPrismaSchema(content, relPath));
                continue;
            }

            // SQL migration files
            if (filePath.endsWith('.sql')) {
                findings.push(...scanSqlFile(content, relPath));
                continue;
            }

            // Django models
            if (filePath.endsWith('models.py')) {
                findings.push(...scanDjangoModels(content, relPath));
                continue;
            }

            // SQLAlchemy models
            if (stack.orm === 'sqlalchemy' && filePath.endsWith('.py')) {
                if (content.includes('Column(') || content.includes('mapped_column(')) {
                    findings.push(...scanSqlAlchemyModels(content, relPath));
                }
                continue;
            }

            // TypeORM entities
            if (stack.orm === 'typeorm' && (filePath.endsWith('.ts') || filePath.endsWith('.js'))) {
                if (content.includes('@Entity(') || content.includes('@Column(')) {
                    findings.push(...scanTypeOrmEntities(content, relPath));
                }
                continue;
            }

            // Diesel schema (Rust)
            if (filePath.endsWith('.rs') && content.includes('table!')) {
                findings.push(...scanDieselSchema(content, relPath));
                continue;
            }
        } catch {
            // Skip unreadable files
        }
    }

    return findings;
}

// ─── Schema File Detection ─────────────────────────────────────

/** Get file extensions and paths that should be scanned for schemas. */
export function getSchemaFilePatterns(stack: StackInfo): string[] {
    const patterns: string[] = ['*.sql'];

    switch (stack.orm) {
        case 'prisma':
            patterns.push('*.prisma');
            break;
        case 'django-orm':
            patterns.push('models.py');
            break;
        case 'sqlalchemy':
            patterns.push('*.py');
            break;
        case 'typeorm':
            patterns.push('*.entity.ts', '*.entity.js');
            break;
        case 'diesel':
        case 'sea-orm':
            patterns.push('schema.rs', '*.rs');
            break;
        case 'drizzle':
            patterns.push('schema.ts', '*.schema.ts');
            break;
    }

    return patterns;
}

// ─── Prisma Schema Scanner ─────────────────────────────────────

function scanPrismaSchema(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');
    let currentModel = '';
    let modelHasTimestamp = false;
    let modelHasPii = false;
    let modelStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Model declarations
        const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
        if (modelMatch) {
            // Check previous model for retention
            if (currentModel && modelHasPii && !modelHasTimestamp) {
                findings.push(createRetentionFinding(filePath, modelStartLine, currentModel));
            }
            currentModel = modelMatch[1];
            modelStartLine = i + 1;
            modelHasTimestamp = false;
            modelHasPii = false;
            continue;
        }

        if (currentModel && line === '}') {
            // End of model — check retention
            if (modelHasPii && !modelHasTimestamp) {
                findings.push(createRetentionFinding(filePath, modelStartLine, currentModel));
            }
            currentModel = '';
            continue;
        }

        if (!currentModel) continue;

        // Check for PII fields
        const fieldMatch = line.match(/^\s*(\w+)\s+/);
        if (fieldMatch) {
            const fieldName = fieldMatch[1].toLowerCase();
            checkPiiField(fieldName, filePath, i + 1, currentModel, findings);
            if (isPiiField(fieldName)) modelHasPii = true;
        }

        // Check for retention fields
        if (line.includes('deletedAt') || line.includes('deleted_at') || line.includes('expiresAt') || line.includes('expires_at') || line.includes('archivedAt')) {
            modelHasTimestamp = true;
        }
    }

    return findings;
}

// ─── SQL Migration Scanner ─────────────────────────────────────

function scanSqlFile(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');
    let currentTable = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // CREATE TABLE
        const tableMatch = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?/i);
        if (tableMatch) {
            currentTable = tableMatch[1];
            continue;
        }

        if (currentTable) {
            // Column definitions
            const colMatch = line.match(/^\s*["`]?(\w+)["`]?\s+(VARCHAR|TEXT|CHAR|INTEGER|INT|BIGINT|INET|CIDR|UUID|JSONB?|TIMESTAMP)/i);
            if (colMatch) {
                const colName = colMatch[1].toLowerCase();
                checkPiiField(colName, filePath, i + 1, currentTable, findings);
            }
        }

        if (line.includes(');')) {
            currentTable = '';
        }
    }

    return findings;
}

// ─── Django Model Scanner ──────────────────────────────────────

function scanDjangoModels(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');
    let currentModel = '';

    // Django-specific field types that hold PII
    const djangoPiiFields: Record<string, { piiType: string; severity: FindingSeverity }> = {
        'EmailField': { piiType: 'email address', severity: 'high' },
        'GenericIPAddressField': { piiType: 'IP address', severity: 'high' },
        'IPAddressField': { piiType: 'IP address', severity: 'high' },
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Class definition
        const classMatch = line.match(/^class\s+(\w+)\s*\(.*Model.*\)/);
        if (classMatch) {
            currentModel = classMatch[1];
            continue;
        }

        if (!currentModel) continue;

        // Check Django PII field types
        for (const [fieldType, pii] of Object.entries(djangoPiiFields)) {
            if (line.includes(fieldType)) {
                findings.push({
                    id: `schema-django-pii-type-${filePath}-${i}`,
                    category: 'schema',
                    severity: pii.severity,
                    title: `PII field type: ${fieldType} in ${currentModel}`,
                    message: `Django ${fieldType} stores ${pii.piiType}. Ensure GDPR compliance measures are in place.`,
                    file: filePath,
                    line: i + 1,
                    rule: 'pii-field-type',
                });
            }
        }

        // Check field names
        const fieldNameMatch = line.match(/^\s+(\w+)\s*=\s*models\.\w+Field/);
        if (fieldNameMatch) {
            const fieldName = fieldNameMatch[1].toLowerCase();
            checkPiiField(fieldName, filePath, i + 1, currentModel, findings);
        }

        // New class = end of previous model
        if (/^class\s/.test(line) && !line.includes('Model')) {
            currentModel = '';
        }
    }

    return findings;
}

// ─── SQLAlchemy Scanner ────────────────────────────────────────

function scanSqlAlchemyModels(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');
    let currentModel = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const classMatch = line.match(/^class\s+(\w+)\s*\(/);
        if (classMatch) {
            currentModel = classMatch[1];
            continue;
        }

        if (!currentModel) continue;

        // Column('name', ...) or mapped_column(...)
        const colMatch = line.match(/(?:Column|mapped_column)\s*\(\s*['"]?(\w+)['"]?/);
        if (colMatch) {
            const colName = colMatch[1].toLowerCase();
            checkPiiField(colName, filePath, i + 1, currentModel, findings);
        }

        // Also check attribute name = Column(...)
        const attrMatch = line.match(/^\s+(\w+)\s*=\s*(?:Column|mapped_column)/);
        if (attrMatch) {
            const attrName = attrMatch[1].toLowerCase();
            checkPiiField(attrName, filePath, i + 1, currentModel, findings);
        }
    }

    return findings;
}

// ─── TypeORM Scanner ───────────────────────────────────────────

function scanTypeOrmEntities(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');
    let currentEntity = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const entityMatch = line.match(/class\s+(\w+)/);
        if (entityMatch && content.slice(0, lines.slice(0, i).join('\n').length).includes('@Entity(')) {
            currentEntity = entityMatch[1];
        }

        if (!currentEntity) continue;

        // @Column() decorated property
        const colMatch = line.match(/^\s+(\w+)\s*[?!]?\s*:\s*/);
        if (colMatch && i > 0 && lines[i - 1].includes('@Column')) {
            const colName = colMatch[1].toLowerCase();
            checkPiiField(colName, filePath, i + 1, currentEntity, findings);
        }
    }

    return findings;
}

// ─── Diesel Schema Scanner (Rust) ──────────────────────────────

function scanDieselSchema(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');
    let currentTable = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // table! { table_name (id) { ... } }
        const tableMatch = line.match(/^\s*(\w+)\s*\(/);
        if (tableMatch && content.slice(0, lines.slice(0, i).join('\n').length).includes('table!')) {
            currentTable = tableMatch[1];
            continue;
        }

        if (currentTable) {
            // column_name -> type
            const colMatch = line.match(/^\s+(\w+)\s*->/);
            if (colMatch) {
                const colName = colMatch[1].toLowerCase();
                checkPiiField(colName, filePath, i + 1, currentTable, findings);
            }
        }

        if (line.trim() === '}') {
            currentTable = '';
        }
    }

    return findings;
}

// ─── Helpers ───────────────────────────────────────────────────

function checkPiiField(
    fieldName: string,
    filePath: string,
    line: number,
    context: string,
    findings: AuditFinding[],
): void {
    const normalized = fieldName.toLowerCase().replace(/[_-]/g, '');

    for (const pii of PII_PATTERNS) {
        const piiNorm = pii.pattern.replace(/[_-]/g, '');
        if (normalized.includes(piiNorm)) {
            findings.push({
                id: `schema-pii-${pii.pattern}-${filePath}-${line}`,
                category: 'schema',
                severity: pii.severity,
                title: `PII column "${fieldName}" in ${context}`,
                message: `Column "${fieldName}" likely stores ${pii.piiType}. ${pii.recommendation}`,
                file: filePath,
                line,
                rule: 'pii-column',
                fix: pii.recommendation,
            });
            return; // One match per field
        }
    }
}

function isPiiField(name: string): boolean {
    const norm = name.toLowerCase().replace(/[_-]/g, '');
    return PII_PATTERNS.some((p) => norm.includes(p.pattern.replace(/[_-]/g, '')));
}

function createRetentionFinding(filePath: string, line: number, model: string): AuditFinding {
    return {
        id: `schema-no-retention-${model}-${filePath}`,
        category: 'schema',
        severity: 'medium',
        title: `No retention policy for ${model}`,
        message: `Model "${model}" contains PII but has no soft-delete (deleted_at) or expiry (expires_at) column. GDPR requires data retention limits.`,
        file: filePath,
        line,
        rule: 'no-retention-policy',
        fix: 'Add a deleted_at/expires_at timestamp column and implement a data retention cleanup job.',
    };
}
