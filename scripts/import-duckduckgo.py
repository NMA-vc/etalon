#!/usr/bin/env python3
"""
Import DuckDuckGo Tracker Radar into ETALON.
Processes domain JSON files from all country folders,
deduplicates by domain, and produces vendors-duckduckgo.json.
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional

# Map DuckDuckGo categories → ETALON VendorCategory
CATEGORY_MAP = {
    'Advertising': 'advertising',
    'Ad Fraud': 'advertising',
    'Ad Motivated Tracking': 'advertising',
    'Analytics': 'analytics',
    'Audience Measurement': 'analytics',
    'Session Replay': 'heatmaps',
    'Online Payment': 'payments',
    'SSO': 'security',
    'Federated Login': 'security',
    'Badge': 'social',
    'Social - Comment': 'social',
    'Social - Share': 'social',
    'Social Network': 'social',
    'Third-Party Analytics Marketing': 'analytics',
    'Content Delivery': 'cdn',
    'CDN': 'cdn',
    'Embedded Content': 'video',
    'Non-Tracking': 'other',
    'Unknown High Risk Behavior': 'other',
    'Obscure Ownership': 'other',
    'Fingerprinting': 'security',
    'Action Pixels': 'advertising',
    'Consent Management': 'consent',
    'Customer Interaction': 'chat',
    'Tag Manager': 'tag_manager',
    'Email': 'email_marketing',
    'Performance': 'analytics',
    'Malware': 'security',
    'Pornvertising': 'advertising',
}

def calculate_risk_score(tracker: Dict) -> int:
    """Auto-calculate risk score from DuckDuckGo data."""
    score = 5.0  # Base score

    # Prevalence (0-1, higher = on more sites = more data collection power)
    prevalence = tracker.get('prevalence', 0)
    if prevalence > 0.4:
        score += 2
    elif prevalence > 0.2:
        score += 1
    elif prevalence > 0.1:
        score += 0.5

    # Fingerprinting (0-3 scale from DuckDuckGo)
    fingerprinting = tracker.get('fingerprinting', 0)
    score += fingerprinting

    # Cookies (aggregate from resources)
    cookies = tracker.get('cookies', 0)
    if cookies > 0.8:
        score += 1
    elif cookies > 0.5:
        score += 0.5

    # High-risk categories
    categories = tracker.get('categories', [])
    high_risk_cats = ['Advertising', 'Ad Motivated Tracking', 'Ad Fraud',
                      'Session Replay', 'Fingerprinting']
    if any(cat in high_risk_cats for cat in categories):
        score += 1

    return min(int(round(score)), 10)


def map_category(categories: List[str]) -> str:
    """Map DuckDuckGo categories to ETALON VendorCategory."""
    for cat in categories:
        if cat in CATEGORY_MAP:
            return CATEGORY_MAP[cat]
    return 'other'


def sanitize_id(domain: str) -> str:
    """Create a vendor ID from a domain name."""
    # Remove TLD-like suffixes and sanitize
    return re.sub(r'[^a-z0-9-]', '-', domain.lower()).strip('-')


def parse_duckduckgo_domain(filepath: Path) -> Optional[Dict]:
    """Parse a single DuckDuckGo domain JSON file."""
    try:
        with open(filepath) as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        return None

    domain = data.get('domain', filepath.stem)

    # Skip IP addresses and weird entries
    if re.match(r'^\d+\.\d+\.\d+\.\d+$', domain):
        return None
    if domain.startswith('_') or len(domain) < 4:
        return None

    # Get owner info
    owner = data.get('owner', {})
    company = owner.get('name', 'Unknown')
    display_name = owner.get('displayName', company)
    privacy_policy = owner.get('privacyPolicy', '')

    # Get categories
    categories = data.get('categories', [])
    primary_category = map_category(categories)

    # Build domains list (main + subdomains)
    domains = [domain]
    for sub in data.get('subdomains', []):
        if sub:
            domains.append(f"{sub}.{domain}")

    # Aggregate cookie usage from resources
    max_cookies = 0
    for resource in data.get('resources', []):
        c = resource.get('cookies', 0)
        if c > max_cookies:
            max_cookies = c

    # Calculate risk score
    tracker_data = {
        'prevalence': data.get('prevalence', 0),
        'fingerprinting': data.get('fingerprinting', 0),
        'cookies': max_cookies,
        'categories': categories,
    }
    risk_score = calculate_risk_score(tracker_data)

    vendor = {
        'id': sanitize_id(domain),
        'domains': sorted(list(set(domains))),
        'name': display_name if display_name != 'Unknown' else domain,
        'company': company,
        'category': primary_category,
        'gdpr_compliant': False,  # Unknown for auto-imported
        'risk_score': risk_score,
        'tier': 'standard',
        'source': 'duckduckgo-tracker-radar',
        'prevalence': data.get('prevalence', 0),
        'fingerprinting': data.get('fingerprinting', 0),
        'cookies': max_cookies,
        'sites': data.get('sites', 0),
    }

    if privacy_policy:
        vendor['privacy_policy'] = privacy_policy

    return vendor


def import_duckduckgo_tracker_radar():
    """Import all DuckDuckGo Tracker Radar domains from all country folders."""
    base_path = Path(__file__).parent.parent / 'data' / 'imports' / 'duckduckgo'
    domains_path = base_path / 'domains'

    if not domains_path.exists():
        print(f"❌ DuckDuckGo data not found at {domains_path}")
        return []

    print(f"📖 Reading DuckDuckGo Tracker Radar from {domains_path}")

    # Collect all JSON files from all country folders
    all_files = []
    for country_dir in sorted(domains_path.iterdir()):
        if country_dir.is_dir():
            files = list(country_dir.glob('*.json'))
            print(f"   {country_dir.name}: {len(files)} domain files")
            all_files.extend(files)

    print(f"   Total: {len(all_files)} domain files across all countries")

    # Parse and deduplicate by domain (keep highest prevalence version)
    vendors_by_domain = {}
    errors = 0

    for i, filepath in enumerate(all_files):
        if i % 5000 == 0 and i > 0:
            print(f"   Processed {i}/{len(all_files)}...")

        vendor = parse_duckduckgo_domain(filepath)
        if vendor is None:
            errors += 1
            continue

        domain = vendor['domains'][0]  # Primary domain
        existing = vendors_by_domain.get(domain)

        if existing is None:
            vendors_by_domain[domain] = vendor
        else:
            # Keep the one with higher prevalence
            if vendor.get('prevalence', 0) > existing.get('prevalence', 0):
                # Merge domains
                all_domains = set(existing['domains']) | set(vendor['domains'])
                vendor['domains'] = sorted(list(all_domains))
                vendors_by_domain[domain] = vendor
            else:
                # Merge new subdomains into existing
                all_domains = set(existing['domains']) | set(vendor['domains'])
                existing['domains'] = sorted(list(all_domains))

    vendors = list(vendors_by_domain.values())
    print(f"\n✅ Imported {len(vendors)} unique vendors from DuckDuckGo")
    if errors > 0:
        print(f"   ⚠️  Skipped {errors} entries (IPs, invalid, etc.)")

    # Stats
    categories = {}
    risk_distribution = {'low (1-3)': 0, 'medium (4-5)': 0, 'high (6-7)': 0, 'critical (8-10)': 0}
    for v in vendors:
        cat = v['category']
        categories[cat] = categories.get(cat, 0) + 1
        score = v['risk_score']
        if score >= 8:
            risk_distribution['critical (8-10)'] += 1
        elif score >= 6:
            risk_distribution['high (6-7)'] += 1
        elif score >= 4:
            risk_distribution['medium (4-5)'] += 1
        else:
            risk_distribution['low (1-3)'] += 1

    total_domains = sum(len(v['domains']) for v in vendors)
    print(f"\n📊 Statistics:")
    print(f"   Total vendors: {len(vendors)}")
    print(f"   Total domains: {total_domains}")
    print(f"   Categories: {len(categories)}")
    print(f"\n   Risk distribution:")
    for k, v in risk_distribution.items():
        print(f"     {k}: {v}")
    print(f"\n   Top 10 categories:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:10]:
        print(f"     {cat}: {count}")

    return vendors


def save_imported_vendors(vendors: List[Dict]):
    """Save imported vendors to JSON."""
    output_path = Path(__file__).parent.parent / 'data' / 'vendors-duckduckgo.json'
    with open(output_path, 'w') as f:
        json.dump(vendors, f, indent=2)
    print(f"\n💾 Saved to: {output_path}")
    print(f"   {len(vendors)} vendors ready to merge")


def main():
    print("🦆 DuckDuckGo Tracker Radar Import")
    print("=" * 60)

    vendors = import_duckduckgo_tracker_radar()
    if vendors:
        save_imported_vendors(vendors)
        print("\n✅ Import complete!")
    else:
        print("\n❌ No vendors imported")


if __name__ == '__main__':
    main()
