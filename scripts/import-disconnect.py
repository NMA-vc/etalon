#!/usr/bin/env python3
"""
Import Disconnect Tracking Protection into ETALON.
Parses services.json and outputs vendors-disconnect.json.
"""

import json
import re
from pathlib import Path
from typing import Dict, List

# Map Disconnect categories → ETALON VendorCategory
CATEGORY_MAP = {
    'Advertising': 'advertising',
    'Analytics': 'analytics',
    'Social': 'social',
    'Content': 'cdn',
    'Email': 'email_marketing',
    'EmailAggressive': 'email_marketing',
    'FingerprintingInvasive': 'security',
    'FingerprintingGeneral': 'security',
    'Anti-fraud': 'security',
    'ConsentManagers': 'consent',
    'Cryptomining': 'other',
}

# Risk scores by Disconnect category
RISK_BY_CATEGORY = {
    'Advertising': 6,
    'Analytics': 4,
    'Social': 5,
    'Content': 2,
    'Email': 4,
    'EmailAggressive': 5,
    'FingerprintingInvasive': 8,
    'FingerprintingGeneral': 6,
    'Anti-fraud': 3,
    'ConsentManagers': 1,
    'Cryptomining': 9,
}


def sanitize_id(name: str) -> str:
    """Create a vendor ID from company name."""
    return re.sub(r'[^a-z0-9-]', '-', name.lower()).strip('-')


def parse_disconnect_services():
    """Parse Disconnect services.json."""
    services_path = Path(__file__).parent.parent / 'data' / 'imports' / 'disconnect' / 'services.json'

    if not services_path.exists():
        print(f"❌ Disconnect data not found at {services_path}")
        return []

    with open(services_path) as f:
        data = json.load(f)

    print(f"📖 Reading Disconnect services.json")

    vendors = {}

    for category_name, entries in data.get('categories', {}).items():
        etalon_category = CATEGORY_MAP.get(category_name, 'other')
        risk_score = RISK_BY_CATEGORY.get(category_name, 5)

        for entry in entries:
            for company_name, company_data in entry.items():
                vendor_id = sanitize_id(company_name)
                if not vendor_id or len(vendor_id) < 2:
                    continue

                # Collect domains from the entry
                domains = []
                website = ''
                for url_or_key, value in company_data.items():
                    if url_or_key.startswith('http'):
                        website = url_or_key
                    if isinstance(value, list):
                        for d in value:
                            if isinstance(d, str) and '.' in d and len(d) > 3:
                                domains.append(d.lower())
                    elif isinstance(value, str) and value in ('performance',):
                        # Some entries have string flags, skip
                        pass

                if not domains:
                    continue

                domains = sorted(list(set(domains)))

                if vendor_id not in vendors:
                    vendors[vendor_id] = {
                        'id': vendor_id,
                        'domains': domains,
                        'name': company_name,
                        'company': company_name,
                        'category': etalon_category,
                        'gdpr_compliant': False,
                        'risk_score': risk_score,
                        'tier': 'standard',
                        'source': 'disconnect',
                        'disconnect_category': category_name,
                    }
                    if website:
                        vendors[vendor_id]['website'] = website
                else:
                    # Merge domains
                    existing = vendors[vendor_id]
                    all_domains = set(existing['domains']) | set(domains)
                    existing['domains'] = sorted(list(all_domains))

    result = list(vendors.values())

    # Stats
    categories = {}
    for v in result:
        cat = v['category']
        categories[cat] = categories.get(cat, 0) + 1

    total_domains = sum(len(v['domains']) for v in result)
    print(f"\n✅ Imported {len(result)} vendors from Disconnect")
    print(f"   Total domains: {total_domains}")
    print(f"\n   By category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"     {cat}: {count}")

    return result


def main():
    print("🔌 Disconnect Tracking Protection Import")
    print("=" * 60)

    vendors = parse_disconnect_services()

    if vendors:
        output_path = Path(__file__).parent.parent / 'data' / 'vendors-disconnect.json'
        with open(output_path, 'w') as f:
            json.dump(vendors, f, indent=2)
        print(f"\n💾 Saved to: {output_path}")
        print(f"   {len(vendors)} vendors ready to merge")
        print("\n✅ Import complete!")
    else:
        print("\n❌ No vendors imported")


if __name__ == '__main__':
    main()
