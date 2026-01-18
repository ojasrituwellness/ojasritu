import base64
import hashlib
import hmac
import uuid
from typing import Dict, Any, Tuple

import requests
from django.conf import settings


class CashfreeError(Exception):
    """Raised when Cashfree interaction fails."""


def _env() -> str:
    return (getattr(settings, 'CASHFREE_ENV', 'TEST') or 'TEST').strip().upper()


def base_url() -> str:
    return 'https://api.cashfree.com/pg' if _env() == 'PROD' else 'https://sandbox.cashfree.com/pg'


def _headers() -> Tuple[Dict[str, str], str]:
    app_id = getattr(settings, 'CASHFREE_APP_ID', None)
    secret = getattr(settings, 'CASHFREE_SECRET_KEY', None)
    if not app_id or not secret:
        raise CashfreeError('Cashfree credentials are not configured')
    headers = {
        'x-client-id': app_id,
        'x-client-secret': secret,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
    }
    return headers, secret


def create_cashfree_order(
    order_id: str,
    amount: float,
    customer: Dict[str, Any],
    return_url: str,
    notify_url: str,
    note: str = 'Pre-booking reservation'
) -> Dict[str, Any]:
    """
    Create a Cashfree order and return the gateway payload (session id, order id, link).
    """
    headers, _secret = _headers()
    payload = {
        'order_id': order_id,
        'order_amount': float(amount),
        'order_currency': 'INR',
        'order_note': note,
        'customer_details': {
            'customer_id': customer.get('id', 'guest') or 'guest',
            'customer_name': customer.get('name') or 'Guest User',
            'customer_email': customer.get('email') or 'guest@example.com',
            'customer_phone': customer.get('phone') or '9999999999',
        },
        'order_meta': {
            'return_url': return_url,
            'notify_url': notify_url,
        },
    }

    resp = requests.post(f"{base_url()}/orders", json=payload, headers=headers, timeout=12)
    try:
        data = resp.json()
    except Exception:
        data = {'message': resp.text}

    if not resp.ok:
        raise CashfreeError(data.get('message') or data)

    if not data.get('payment_session_id'):
        raise CashfreeError('Cashfree did not return a payment_session_id')

    return data


def verify_signature(raw_body: bytes, signature: str) -> bool:
    """
    Verify webhook/callback signature using HMAC-SHA256 of the raw body.
    Cashfree docs specify a base64-encoded signature of the request payload.
    """
    secret = getattr(settings, 'CASHFREE_SECRET_KEY', None)
    if not secret or not signature:
        return False

    digest = hmac.new(secret.encode('utf-8'), raw_body or b'', hashlib.sha256).digest()
    expected_b64 = base64.b64encode(digest).decode()
    expected_hex = digest.hex()
    return hmac.compare_digest(signature, expected_b64) or hmac.compare_digest(signature, expected_hex)


def normalize_status(status: str) -> str:
    s = (status or '').lower()
    if s in ('success', 'paid', 'completed', 'captured', 'payment_success'):  # Cashfree success variations
        return 'paid'
    if s in ('failed', 'failure', 'cancelled', 'canceled', 'payment_failed'):
        return 'failed'
    return 'pending'


def safe_order_id(prefix: str = 'CF') -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"
