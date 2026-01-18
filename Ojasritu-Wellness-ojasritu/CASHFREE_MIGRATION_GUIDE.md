# Cashfree Payment Gateway Migration Guide

## 📋 Overview

Successfully migrated from Razorpay to Cashfree payment gateway. This document details all changes, setup requirements, and testing procedures.

## ✅ Completed Changes

### 1. **Backend (Django)**

#### New Files
- `shop/cashfree.py` - Cashfree integration utilities
  - `create_cashfree_order()` - Creates order and returns session ID
  - `verify_signature()` - Validates webhook signatures (HMAC-SHA256)
  - `normalize_status()` - Maps Cashfree statuses to internal statuses
  - `safe_order_id()` - Generates unique order IDs

#### Modified Files
- `shop/models.py`
  - Added `payment_method` choices including 'cashfree'
  - Added `payment_status` with values: 'pending', 'paid', 'failed'
  - Added `cashfree_order_id` field (unique, nullable)
  - Added `cashfree_payment_session_id` field
  - Added `cart_snapshot` field for order context

- `shop/api.py`
  - Added `cashfree_create_order()` endpoint - POST `/api/cashfree/create/`
    - Creates Cashfree order from user's cart
    - Returns: `order_id`, `payment_session_id`, `payment_redirect_url`
  - Added `cashfree_webhook()` endpoint - POST `/api/cashfree/webhook/`
    - Handles payment status webhooks
    - Verifies signature and updates order status
  - Updated legacy `create_prebooking()` and `create_prebooking_from_cart()` to use Cashfree

- `wellness_project/settings.py`
  - Added Cashfree environment variables:
    - `CASHFREE_APP_ID` - Application ID
    - `CASHFREE_SECRET_KEY` - API secret key
    - `CASHFREE_ENV` - 'TEST' (default) or 'PROD'

### 2. **Frontend (React)**

#### Modified Files
- `frontend/src/services/apiService.js`
  - Added `cashfreeAPI` object with `createOrder()` method
  - Integrated with existing CSRF/session auth

- `frontend/src/pages/Checkout.jsx`
  - Replaced prebooking simulation with real Cashfree integration
  - Updated button text: "Confirm Pre-booking" → "Proceed to Payment"
  - Added payment status messaging
  - Redirects to Cashfree payment page on checkout

- `frontend/src/pages/PrivacyPolicy.jsx`
  - Updated references: "Razorpay" → "Cashfree"

- `frontend/src/pages/Products.jsx` & `Products_old.jsx`
  - Updated comments: "Razorpay integration" → "Cashfree integration"

- `frontend/package.json`
  - Removed dependency: `razorpay@^2.1.0`

### 3. **Dependencies**

#### Removed
- `requirements.txt`: Removed `razorpay>=1.4.0`
- `frontend/package.json`: Removed `razorpay` package

#### Added
- `requirements.txt`: Added `requests>=2.28.0` (for Cashfree API calls)

## 🔧 Setup & Configuration

### Backend Setup

1. **Install dependencies** (if not already done):
   ```bash
   pip install -r requirements.txt
   ```

2. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Configure environment variables**:
   Create `.env` file or set in Railway dashboard:
   ```
   CASHFREE_APP_ID=your_app_id
   CASHFREE_SECRET_KEY=your_secret_key
   CASHFREE_ENV=TEST  # or PROD
   ```

### Frontend Setup

1. **Reinstall dependencies** (to remove Razorpay):
   ```bash
   cd frontend
   npm install
   ```

2. **Build**:
   ```bash
   npm run build
   ```

## 🧪 Testing Guide

### Local Development

#### Setup
```bash
# Terminal 1: Backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

#### Test Flows

**1. Google Login**
- Navigate to login page
- Click "Sign in with Google"
- Complete Google authentication
- Should redirect to profile page
- Check: Session cookie set, user data loaded

**2. Cart & Checkout (with Cashfree)**
- Add products to cart
- Navigate to checkout
- Verify cart items and total displayed
- Click "Proceed to Payment"
- Should redirect to Cashfree payment page
- Test in Cashfree Test environment

**3. Webhook Testing**
- Use Cashfree sandbox environment for testing
- Mock webhook with curl:
  ```bash
  # Generate signature (Python):
  import hmac, hashlib, base64, json
  secret = "your_secret_key"
  body = json.dumps({"order_id": "CF-xxx", "payment_status": "SUCCESS"})
  sig = base64.b64encode(hmac.new(secret.encode(), body.encode(), hashlib.sha256).digest()).decode()
  
  # Send webhook:
  curl -X POST http://localhost:8000/api/cashfree/webhook/ \
    -H "X-Cashfree-Signature: $sig" \
    -H "Content-Type: application/json" \
    -d "$body"
  ```

### Important Test Cases

| Flow | Expected Behavior | Notes |
|------|---|---|
| Create order without auth | 401 Unauthorized | Must be logged in |
| Create order with empty cart | 400 Bad Request | Cart must have items |
| Google login with valid token | 200 + session | Email extracted, profile created |
| Google login with invalid token | 400 + error | Token verification fails |
| Webhook with invalid signature | 403 Forbidden | Signature mismatch |
| Webhook with success status | 200 + order updated | Order status = 'paid' |
| Webhook with failed status | 200 + order updated | Order status = 'failed' |

## 📦 Deployment (Railway)

### Pre-deployment Checklist

- [ ] `.env` file removed from repo
- [ ] Migrations applied locally
- [ ] Google OAuth env vars set (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- [ ] Cashfree env vars set (CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV)
- [ ] Frontend build tested: `npm run build`

### Railway Deployment

1. **Set environment variables in Railway dashboard**:
   - `CASHFREE_APP_ID` - From Cashfree dashboard
   - `CASHFREE_SECRET_KEY` - From Cashfree dashboard
   - `CASHFREE_ENV` - Use 'TEST' for staging, 'PROD' for production
   - `GOOGLE_CLIENT_ID` - OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - OAuth client secret

2. **Deploy**:
   ```bash
   git add -A
   git commit -m "chore: migrate from Razorpay to Cashfree"
   git push origin main  # Triggers Railway auto-deploy
   ```

3. **Post-deployment verification**:
   - Check Railway logs for migrations
   - Test login flow on production domain
   - Test checkout with TEST Cashfree credentials
   - Verify webhook endpoint is accessible

## 🔐 Security Notes

- **Signature Verification**: Implemented HMAC-SHA256 validation for all webhooks
- **Token Expiry**: Google tokens validated for expiry before use
- **CSRF Protection**: All mutations require valid CSRF tokens
- **Session-based Auth**: No JWT tokens; relies on Django session cookies
- **Email Normalization**: User emails converted to lowercase to prevent duplicates

## ⚠️ Known Issues & Mitigations

### Issue 1: Cashfree Test/Prod Switching
**Description**: Switching between TEST and PROD environments requires code/config change
**Mitigation**: Use environment variable `CASHFREE_ENV` to control endpoint

### Issue 2: Avatar Download Timeout
**Description**: Google avatar download might timeout on slow connections
**Mitigation**: 5-second timeout; failures don't block login (logged as non-fatal)

### Issue 3: Webhook Delivery Delays
**Description**: Cashfree webhooks might arrive out-of-order or delayed
**Mitigation**: Idempotent status updates; only update if status actually changed

## 📝 API Endpoints Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/cashfree/create/` | Required | Create payment order from cart |
| POST | `/api/cashfree/webhook/` | None | Receive payment status updates |
| POST | `/api/auth/google/` | AllowAny | Google OAuth login |
| GET | `/api/auth/csrf/` | AllowAny | Get CSRF token |
| POST | `/api/auth/check/` | Required | Check authentication status |
| GET | `/api/cart/` | Required | Get user's cart |
| POST | `/api/cart/add/` | Required | Add product to cart |

## 🚀 Next Steps

1. **Monitor logs** for webhook processing
2. **Test real payments** in Cashfree TEST environment
3. **Set up email notifications** for payment status changes
4. **Document user-facing changes** in help/FAQ pages
5. **Update refund process** documentation

## 📚 Resources

- Cashfree API Docs: https://docs.cashfree.com/
- Django REST Framework: https://www.django-rest-framework.org/
- React Best Practices: https://react.dev/

## 🎯 Rollback Plan

If issues occur in production:

1. **Revert to previous working commit**:
   ```bash
   git revert -m 1 <commit-hash>
   git push origin main
   ```

2. **Check database state**:
   - Cashfree orders will retain their `cashfree_order_id` values
   - Orders can still be queried and updated

3. **Notify affected users** about temporary payment issues

---

**Last Updated**: December 2025
**Status**: ✅ Ready for Testing
**Next Review**: After first production payments
