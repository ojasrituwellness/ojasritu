#!/usr/bin/env python3
"""
Prune products not in the allowed whitelist. Safe to run; does not alter migrations.
Usage: python scripts/prune_products.py --dry-run
"""
import os
import django
import argparse

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wellness_project.settings')
django.setup()

from shop.models import Product

ALLOWED = [
    'JIVAASTHI',
    'Anti-Aging & Calmness Capsule'
]

parser = argparse.ArgumentParser(description='Prune products not in whitelist')
parser.add_argument('--dry-run', action='store_true', help='Show products that would be deleted')
args = parser.parse_args()

products = Product.objects.all()

removed = []
for p in products:
    name = (p.name or '').strip()
    if name not in ALLOWED:
        removed.append((p.id, name))

if args.dry_run:
    print('Products that would be removed:')
    for r in removed:
        print(f'- id={r[0]} name="{r[1]}"')
    print(f'Total: {len(removed)}')
else:
    print(f'Deleting {len(removed)} products...')
    for r in removed:
        try:
            Product.objects.filter(id=r[0]).delete()
            print(f'Deleted id={r[0]} name="{r[1]}"')
        except Exception as e:
            print(f'Failed to delete id={r[0]} name="{r[1]}": {e}')
    print('Done.')
