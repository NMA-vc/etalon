import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractDomain, getParentDomains } from './domain-utils.js';
import type { Vendor, Category, VendorDatabase, VendorCategory } from './types.js';

/**
 * VendorRegistry provides O(1) domain-to-vendor lookups, category filtering,
 * and search capabilities over the ETALON vendor database.
 */
export class VendorRegistry {
    private vendors: Vendor[] = [];
    private categories: Category[] = [];
    private domainMap: Map<string, Vendor> = new Map();
    private version = '';
    private lastUpdated = '';

    /**
     * Load the vendor database from a JSON file.
     * If no path is provided, loads the bundled vendors.json.
     */
    static load(path?: string): VendorRegistry {
        const registry = new VendorRegistry();

        const filePath = path ?? VendorRegistry.defaultPath();
        const raw = readFileSync(filePath, 'utf-8');
        const db: VendorDatabase = JSON.parse(raw);

        registry.version = db.version;
        registry.lastUpdated = db.last_updated;
        registry.vendors = db.vendors;
        registry.categories = db.categories;

        // Build the domain lookup map
        for (const vendor of db.vendors) {
            for (const domain of vendor.domains) {
                registry.domainMap.set(domain.toLowerCase(), vendor);
            }
        }

        return registry;
    }

    /**
     * Load from an in-memory VendorDatabase object (useful for testing).
     */
    static fromDatabase(db: VendorDatabase): VendorRegistry {
        const registry = new VendorRegistry();
        registry.version = db.version;
        registry.lastUpdated = db.last_updated;
        registry.vendors = db.vendors;
        registry.categories = db.categories;

        for (const vendor of db.vendors) {
            for (const domain of vendor.domains) {
                registry.domainMap.set(domain.toLowerCase(), vendor);
            }
        }

        return registry;
    }

    /**
     * Look up a vendor by domain.
     * Tries exact match first, then walks up parent domains.
     * 
     * @param domainOrUrl - A domain (e.g. "ssl.google-analytics.com") or full URL
     * @returns The matched Vendor, or null if not found
     */
    lookupDomain(domainOrUrl: string): Vendor | null {
        // If it looks like a URL, extract the domain
        let domain: string;
        if (domainOrUrl.includes('://')) {
            const extracted = extractDomain(domainOrUrl);
            if (!extracted) return null;
            domain = extracted;
        } else {
            domain = domainOrUrl.toLowerCase();
        }

        // Exact match
        const exact = this.domainMap.get(domain);
        if (exact) return exact;

        // Walk up parent domains
        const parents = getParentDomains(domain);
        for (const parent of parents) {
            const match = this.domainMap.get(parent);
            if (match) return match;
        }

        return null;
    }

    /**
     * Get all vendors in a specific category.
     */
    getByCategory(category: VendorCategory): Vendor[] {
        return this.vendors.filter((v) => v.category === category);
    }

    /**
     * Get all GDPR-compliant vendors.
     */
    getCompliant(): Vendor[] {
        return this.vendors.filter((v) => v.gdpr_compliant);
    }

    /**
     * Get all available categories.
     */
    getCategories(): Category[] {
        return [...this.categories];
    }

    /**
     * Search vendors by name or company (case-insensitive substring match).
     */
    search(query: string): Vendor[] {
        const q = query.toLowerCase();
        return this.vendors.filter(
            (v) =>
                v.name.toLowerCase().includes(q) ||
                v.company.toLowerCase().includes(q) ||
                v.id.toLowerCase().includes(q)
        );
    }

    /**
     * Get all vendors.
     */
    getAllVendors(): Vendor[] {
        return [...this.vendors];
    }

    /**
     * Get a vendor by its ID.
     */
    getById(id: string): Vendor | null {
        return this.vendors.find((v) => v.id === id) ?? null;
    }

    /**
     * Get registry metadata.
     */
    getMetadata() {
        return {
            version: this.version,
            lastUpdated: this.lastUpdated,
            vendorCount: this.vendors.length,
            categoryCount: this.categories.length,
            domainCount: this.domainMap.size,
        };
    }

    /**
     * Default path to the bundled vendors.json file.
     */
    private static defaultPath(): string {
        const currentDir = dirname(fileURLToPath(import.meta.url));
        // When built: dist/index.js -> ../data/vendors.json (package root)
        // Fallback: monorepo root data/vendors.json
        const packagePath = join(currentDir, '..', 'data', 'vendors.json');
        const monorepoPath = join(currentDir, '..', '..', '..', 'data', 'vendors.json');
        try {
            readFileSync(packagePath, 'utf-8');
            return packagePath;
        } catch {
            return monorepoPath;
        }
    }
}
