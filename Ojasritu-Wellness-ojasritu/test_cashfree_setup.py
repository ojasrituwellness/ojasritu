#!/usr/bin/env python
"""
Quick test script for Cashfree integration.
Run this after migrations to verify setup.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wellness_project.settings')
django.setup()

from django.contrib.auth.models import User
from shop.models import Order, Product, Cart, CartItem
from shop.cashfree import create_cashfree_order, safe_order_id, normalize_status, CashfreeError

print("=" * 60)
print("CASHFREE INTEGRATION TEST SUITE")
print("=" * 60)

# Test 1: Order ID Generation
print("\n✓ Test 1: Order ID Generation")
try:
    order_id = safe_order_id()
    assert order_id.startswith("CF-"), f"Order ID should start with CF-, got {order_id}"
    print(f"  Generated order ID: {order_id}")
except Exception as e:
    print(f"  ✗ Failed: {e}")

# Test 2: Status Normalization
print("\n✓ Test 2: Status Normalization")
test_cases = [
    ("SUCCESS", "paid"),
    ("success", "paid"),
    ("COMPLETED", "paid"),
    ("PAID", "paid"),
    ("FAILED", "failed"),
    ("CANCELLED", "failed"),
    ("PENDING", "pending"),
    ("unknown", "pending"),
]
try:
    for input_status, expected in test_cases:
        result = normalize_status(input_status)
        assert result == expected, f"normalize_status('{input_status}') = '{result}', expected '{expected}'"
        print(f"  {input_status:15} → {result:10} ✓")
except Exception as e:
    print(f"  ✗ Failed: {e}")

# Test 3: Cashfree Config Check
print("\n✓ Test 3: Cashfree Configuration")
from django.conf import settings
app_id = getattr(settings, 'CASHFREE_APP_ID', '')
secret = getattr(settings, 'CASHFREE_SECRET_KEY', '')
env = getattr(settings, 'CASHFREE_ENV', 'TEST')

if not app_id or not secret:
    print(f"  ⚠ Warning: Cashfree credentials not fully configured")
    print(f"    APP_ID: {'✓ Set' if app_id else '✗ Not set'}")
    print(f"    SECRET: {'✓ Set' if secret else '✗ Not set'}")
    print(f"  This is OK for local development, but required for production")
else:
    print(f"  ✓ APP_ID configured")
    print(f"  ✓ SECRET_KEY configured")

print(f"  Environment: {env}")

# Test 4: Google OAuth Config Check
print("\n✓ Test 4: Google OAuth Configuration")
google_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
google_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')

if not google_id:
    print(f"  ⚠ Warning: GOOGLE_CLIENT_ID not configured")
    print(f"    Google login will not work until this is set")
else:
    print(f"  ✓ GOOGLE_CLIENT_ID configured")

if not google_secret:
    print(f"  ⚠ Warning: GOOGLE_CLIENT_SECRET not configured")
else:
    print(f"  ✓ GOOGLE_CLIENT_SECRET configured")

# Test 5: Database Models Check
print("\n✓ Test 5: Database Models")
try:
    # Check Order model has Cashfree fields
    order_fields = [f.name for f in Order._meta.get_fields()]
    required_fields = ['cashfree_order_id', 'cashfree_payment_session_id', 'payment_status']
    for field in required_fields:
        if field in order_fields:
            print(f"  ✓ Order.{field} exists")
        else:
            print(f"  ✗ Order.{field} missing")
            
    # Check payment_method choices include cashfree
    payment_method_choices = [choice[0] for choice in Order._meta.get_field('payment_method').choices]
    if 'cashfree' in payment_method_choices:
        print(f"  ✓ payment_method includes 'cashfree'")
    else:
        print(f"  ✗ payment_method missing 'cashfree': {payment_method_choices}")
        
except Exception as e:
    print(f"  ✗ Failed: {e}")

# Test 6: Test User Creation (Optional)
print("\n✓ Test 6: Test User (Optional)")
try:
    test_user, created = User.objects.get_or_create(
        username='testuser_cashfree',
        defaults={'email': 'test_cashfree@example.com'}
    )
    if created:
        print(f"  ✓ Created test user: {test_user.username}")
    else:
        print(f"  ✓ Test user exists: {test_user.username}")
        
    # Check if user has cart
    cart, cart_created = Cart.objects.get_or_create(customer=test_user)
    if cart_created:
        print(f"  ✓ Created cart for test user")
    else:
        print(f"  ✓ Cart exists for test user (items: {cart.items.count()})")
except Exception as e:
    print(f"  ✗ Failed: {e}")

# Test 7: API Endpoints Check
print("\n✓ Test 7: API Endpoints Available")
from django.urls import resolve, NoReverseMatch
endpoints = [
    'api-cashfree-create',
    'api-cashfree-webhook',
    'api-auth-google',
    'api-auth-csrf',
    'api-prebook',
    'api-prebook-cart',
]
for endpoint_name in endpoints:
    try:
        resolve(f'/api/cashfree/create/' if 'cashfree-create' in endpoint_name else 
                f'/api/cashfree/webhook/' if 'cashfree-webhook' in endpoint_name else
                f'/api/auth/google/' if 'auth-google' in endpoint_name else
                f'/api/auth/csrf/' if 'auth-csrf' in endpoint_name else
                f'/api/prebook/' if endpoint_name == 'api-prebook' else
                f'/api/prebook/cart/')
        print(f"  ✓ {endpoint_name}")
    except Exception as e:
        print(f"  ⚠ {endpoint_name}: {e}")

print("\n" + "=" * 60)
print("TEST SUITE COMPLETE")
print("=" * 60)
print("\nNext steps:")
print("1. Set Cashfree credentials in .env or environment variables")
print("2. Set Google OAuth credentials")
print("3. Run: python manage.py runserver")
print("4. Test checkout flow at http://localhost:5173/checkout")
print("5. Test Google login at http://localhost:5173/login")
