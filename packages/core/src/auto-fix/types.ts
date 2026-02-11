// ─── Auto-Fix Types ───────────────────────────────────────────────

export interface FixLocation {
    file: string;
    line: number;
    column: number;
    code: string;
    context: 'component' | 'hook' | 'script' | 'config' | 'import' | 'inline';
}

export interface FixTemplate {
    tracker_id: string;
    tracker_name: string;
    violation_type: 'no_consent' | 'insecure_cookie' | 'pii_leak' | 'cross_site';
    detect_patterns: RegExp[];
    frameworks: {
        [framework: string]: FrameworkHandler;
    };
}

export interface FrameworkHandler {
    detector: (code: string) => FixLocation[];
    fixer: (code: string, location: FixLocation) => string;
    requiresConsentState?: boolean;
    requiresImports?: string[];
    testCase?: string;
}

export interface FixResult {
    success: boolean;
    error?: string;
    changes?: {
        file: string;
        before: string;
        after: string;
        linesChanged: number;
    };
}

export interface FixSuggestion {
    tracker_id: string;
    tracker_name: string;
    location: FixLocation;
    framework: string;
    violation_type: string;
    description: string;
    preview: {
        before: string;
        after: string;
    };
}

export type SupportedFramework = 'react' | 'nextjs' | 'vue' | 'vanilla';
