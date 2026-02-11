#!/usr/bin/env python3
"""
Merge all vendor databases with intelligent deduplication.
Priority: Premium (existing 177) > DuckDuckGo > Disconnect

Produces a unified vendors.json in the ETALON VendorDatabase format.
"""

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List


# Complete set of ETALON categories (existing + new ones needed for imports)
VALID_CATEGORIES = {
    'analytics', 'advertising', 'social', 'cdn', 'payments', 'chat',
    'heatmaps', 'ab_testing', 'error_tracking', 'tag_manager', 'consent',
    'video', 'fonts', 'security', 'push', 'forms', 'referral', 'booking',
    'maps', 'web3', 'b2b_intelligence', 'email_marketing', 'other',
}

# Category metadata for new categories
NEW_CATEGORIES = [
    {
        'id': 'email_marketing',
        'name': 'Email Marketing',
        'description': 'Email tracking pixels, open tracking, and email marketing platforms',
        'risk_level': 'medium',
    },
]


def load_vendors(filename: str, data_dir: Path) -> List[Dict]:
    """Load vendor JSON file."""
    path = data_dir / filename
    if not path.exists():
        print(f"  ⚠️  {filename} not found, skipping")
        return []

    with open(path) as f:
        data = json.load(f)

    # Handle VendorDatabase format (with wrapper) vs raw list
    if isinstance(data, dict) and 'vendors' in data:
        return data['vendors']
    elif isinstance(data, list):
        return data
    else:
        print(f"  ⚠️  Unexpected format in {filename}")
        return []


def load_categories(data_dir: Path) -> List[Dict]:
    """Load existing categories from vendors.json."""
    path = data_dir / 'vendors.json'
    if not path.exists():
        return []
    with open(path) as f:
        data = json.load(f)
    return data.get('categories', [])


def normalize_vendor(vendor: Dict) -> Dict:
    """Ensure a vendor has all required fields and valid category."""
    # Ensure required fields
    vendor.setdefault('id', 'unknown')
    vendor.setdefault('domains', [])
    vendor.setdefault('name', vendor['id'])
    vendor.setdefault('company', 'Unknown')
    vendor.setdefault('category', 'other')
    vendor.setdefault('gdpr_compliant', False)
    vendor.setdefault('risk_score', 5)

    # Clamp risk score
    vendor['risk_score'] = max(1, min(10, vendor['risk_score']))

    # Validate category
    if vendor['category'] not in VALID_CATEGORIES:
        vendor['category'] = 'other'

    # Lowercase all domains
    vendor['domains'] = [d.lower() for d in vendor['domains'] if d]

    return vendor


def merge_vendors(premium: List[Dict], duckduckgo: List[Dict], disconnect: List[Dict]) -> List[Dict]:
    """
    Merge all vendor lists with intelligent deduplication.
    Priority: premium > duckduckgo > disconnect.
    Uses domain overlap for deduplication.
    """
    # Mark tiers
    for v in premium:
        v['tier'] = 'premium'
    for v in duckduckgo:
        v.setdefault('tier', 'standard')
    for v in disconnect:
        v.setdefault('tier', 'standard')

    # Build domain → vendor_id index from premium first
    domain_to_id = {}
    vendors_by_id = {}

    # Pass 1: Index premium vendors (highest priority)
    for v in premium:
        v = normalize_vendor(v)
        vid = v['id']
        vendors_by_id[vid] = v
        for domain in v['domains']:
            domain_to_id[domain] = vid

    print(f"  Indexed {len(vendors_by_id)} premium vendors ({len(domain_to_id)} domains)")

    # Pass 2: Add DuckDuckGo vendors (skip if domain overlap with premium)
    ddg_added = 0
    ddg_merged = 0
    for v in duckduckgo:
        v = normalize_vendor(v)

        # Check if any domain already belongs to a premium vendor
        matched_premium_id = None
        for domain in v['domains']:
            if domain in domain_to_id:
                existing_id = domain_to_id[domain]
                if vendors_by_id[existing_id].get('tier') == 'premium':
                    matched_premium_id = existing_id
                    break

        if matched_premium_id:
            # Enrich premium vendor with additional domains from DDG
            existing = vendors_by_id[matched_premium_id]
            new_domains = set(v['domains']) - set(existing['domains'])
            if new_domains:
                existing['domains'] = sorted(list(set(existing['domains']) | new_domains))
                for d in new_domains:
                    domain_to_id[d] = matched_premium_id
            ddg_merged += 1
            continue

        # Check if domain already claimed by another DDG vendor
        matched_id = None
        for domain in v['domains']:
            if domain in domain_to_id:
                matched_id = domain_to_id[domain]
                break

        if matched_id:
            # Merge domains into existing
            existing = vendors_by_id[matched_id]
            all_domains = set(existing['domains']) | set(v['domains'])
            existing['domains'] = sorted(list(all_domains))
            for d in v['domains']:
                domain_to_id[d] = matched_id
            ddg_merged += 1
        else:
            # New vendor
            vid = v['id']
            # Handle ID collisions
            if vid in vendors_by_id:
                vid = f"{vid}-ddg"
                v['id'] = vid
            vendors_by_id[vid] = v
            for d in v['domains']:
                domain_to_id[d] = vid
            ddg_added += 1

    print(f"  Added {ddg_added} DuckDuckGo vendors, merged {ddg_merged} into existing")

    # Pass 3: Add Disconnect vendors (fill remaining gaps)
    dc_added = 0
    dc_merged = 0
    for v in disconnect:
        v = normalize_vendor(v)

        # Check if any domain already claimed
        matched_id = None
        for domain in v['domains']:
            if domain in domain_to_id:
                matched_id = domain_to_id[domain]
                break

        if matched_id:
            # Merge domains into existing
            existing = vendors_by_id[matched_id]
            new_domains = set(v['domains']) - set(existing['domains'])
            if new_domains:
                existing['domains'] = sorted(list(set(existing['domains']) | new_domains))
                for d in new_domains:
                    domain_to_id[d] = matched_id
            dc_merged += 1
        else:
            # New vendor
            vid = v['id']
            if vid in vendors_by_id:
                vid = f"{vid}-dc"
                v['id'] = vid
            vendors_by_id[vid] = v
            for d in v['domains']:
                domain_to_id[d] = vid
            dc_added += 1

    print(f"  Added {dc_added} Disconnect vendors, merged {dc_merged} into existing")

    # Clean up: remove import-specific fields from final output
    cleanup_fields = ['source', 'prevalence', 'fingerprinting', 'cookies',
                      'sites', 'disconnect_category', 'website']
    result = []
    for v in vendors_by_id.values():
        # Keep import metadata in a nested object for reference
        metadata = {}
        for field in cleanup_fields:
            if field in v:
                metadata[field] = v.pop(field)
        if metadata:
            v['_import_metadata'] = metadata
        result.append(v)

    # Sort by ID for deterministic output
    result.sort(key=lambda v: v['id'])

    return result


def main():
    print("🔀 Merging All Vendor Databases")
    print("=" * 60)

    data_dir = Path(__file__).parent.parent / 'data'

    # Load all databases
    print("\n📦 Loading databases...")
    premium = load_vendors('vendors.json', data_dir)
    duckduckgo = load_vendors('vendors-duckduckgo.json', data_dir)
    disconnect = load_vendors('vendors-disconnect.json', data_dir)

    print(f"  Premium (existing): {len(premium)} vendors")
    print(f"  DuckDuckGo: {len(duckduckgo)} vendors")
    print(f"  Disconnect: {len(disconnect)} vendors")

    # Backup existing vendors.json
    backup_path = data_dir / 'vendors-backup.json'
    original_path = data_dir / 'vendors.json'
    if original_path.exists():
        shutil.copy(original_path, backup_path)
        print(f"\n💾 Backed up existing to: {backup_path}")

    # Merge
    print("\n🔄 Merging...")
    merged = merge_vendors(premium, duckduckgo, disconnect)

    # Count by tier
    by_tier = {'premium': 0, 'standard': 0, 'basic': 0}
    for v in merged:
        tier = v.get('tier', 'standard')
        by_tier[tier] = by_tier.get(tier, 0) + 1

    total_domains = sum(len(v.get('domains', [])) for v in merged)

    # Category counts
    categories = {}
    for v in merged:
        cat = v.get('category', 'other')
        categories[cat] = categories.get(cat, 0) + 1

    # Risk distribution
    risk_dist = {'critical (8-10)': 0, 'high (6-7)': 0, 'medium (4-5)': 0, 'low (1-3)': 0}
    for v in merged:
        score = v.get('risk_score', 5)
        if score >= 8:
            risk_dist['critical (8-10)'] += 1
        elif score >= 6:
            risk_dist['high (6-7)'] += 1
        elif score >= 4:
            risk_dist['medium (4-5)'] += 1
        else:
            risk_dist['low (1-3)'] += 1

    print(f"\n📊 Final Statistics:")
    print(f"   Total vendors: {len(merged)}")
    print(f"   Premium (curated): {by_tier['premium']}")
    print(f"   Standard (auto): {by_tier['standard']}")
    print(f"   Total domains: {total_domains}")
    print(f"   Categories: {len(categories)}")

    print(f"\n   Risk Distribution:")
    for k, v in risk_dist.items():
        print(f"     {k}: {v}")

    print(f"\n   Top 15 categories:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:15]:
        print(f"     {cat}: {count}")

    # Load existing categories and add new ones
    existing_categories = load_categories(data_dir)
    existing_cat_ids = {c['id'] for c in existing_categories}
    for new_cat in NEW_CATEGORIES:
        if new_cat['id'] not in existing_cat_ids:
            existing_categories.append(new_cat)
            print(f"\n   Added new category: {new_cat['id']}")

    # Build final VendorDatabase
    now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    vendor_db = {
        'version': '3.0.0',
        'last_updated': now,
        'vendors': merged,
        'categories': existing_categories,
    }

    # Save merged database
    output_path = data_dir / 'vendors.json'
    with open(output_path, 'w') as f:
        json.dump(vendor_db, f, indent=4)

    # Also copy to packages/core/data/
    core_path = data_dir.parent / 'packages' / 'core' / 'data' / 'vendors.json'
    if core_path.parent.exists():
        shutil.copy(output_path, core_path)
        print(f"\n   Copied to: {core_path}")

    print(f"\n💾 Saved merged database to: {output_path}")
    print(f"\n✅ Merge complete!")
    print(f"   {len(merged)} total vendors")
    print(f"   {total_domains} total domains")


if __name__ == '__main__':
    main()
