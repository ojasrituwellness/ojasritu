# 🚀 QUICK START: CASHFREE INTEGRATION

## 5-Minute Setup Guide

### For Local Testing

```bash
# 1. Install dependencies
pip install -r requirements.txt
cd frontend && npm install && cd ..

# 2. Configure environment (.env file)
cat > .env << EOF
CASHFREE_APP_ID=demo
CASHFREE_SECRET_KEY=demo_secret
CASHFREE_ENV=TEST
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
EOF

# 3. Run migrations
python manage.py migrate

# 4. Start servers
# Terminal 1:
python manage.py runserver 0.0.0.0:8000

# Terminal 2:
cd frontend && npm run dev

# 5. Test
# Browser: http://localhost:5173
# - Try login (Google or email/password)
# - Add products to cart
# - Go to checkout
# - Click "Proceed to Payment"
```

### For Railway Deployment

```bash
# 1. Push changes
git add -A
git commit -m "chore: migrate from Razorpay to Cashfree"
git push origin main

# 2. Set environment in Railway Dashboard
# Settings → Variables
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENV=PROD (or TEST)
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret

# 3. Deploy automatically triggers on push
# Check logs for: "Running migrations..." 

# 4. Verify deployment
# Test at: https://your-railway-domain.app
```

## ✅ Key Files Changed

```
✅ shop/cashfree.py (NEW)          - Cashfree utilities
✅ shop/api.py                      - New /api/cashfree/* endpoints
✅ shop/models.py                   - Order model updates
✅ wellness_project/settings.py     - Cashfree env vars
✅ shop/migrations/0004_*.py        - Database changes
✅ frontend/src/services/apiService.js - Cashfree API client
✅ frontend/src/pages/Checkout.jsx  - Payment UI
✅ frontend/src/pages/Login.jsx     - Improved Google login
✅ requirements.txt                 - Removed razorpay
✅ frontend/package.json            - Removed razorpay
```

## 🧪 Quick Test Commands

```bash
# Test Cashfree setup
python test_cashfree_setup.py

# Check migrations
python manage.py showmigrations

# Run tests (if available)
pytest shop/tests/ -v

# Test API endpoints
curl http://localhost:8000/api/auth/csrf/
curl http://localhost:8000/api/products/ | python -m json.tool
```

## 🔗 Important Endpoints

| URL | Purpose |
|-----|---------|
| `GET /api/products/` | Product list |
| `POST /api/cart/add/` | Add to cart |
| `GET /api/cart/` | View cart |
| `POST /api/cashfree/create/` | Start payment |
| `POST /api/auth/google/` | Google login |

## ⚠️ Before Going Live

- [ ] Set real Cashfree credentials in Railway
- [ ] Test payment flow with real test cards
- [ ] Verify webhook URL is accessible
- [ ] Configure Cashfree dashboard with return/notify URLs
- [ ] Set Google OAuth redirect URIs

## 🆘 Troubleshooting

**"Cashfree credentials not configured"**
→ Add `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` to `.env` or Railway variables

**Google login fails**
→ Verify `GOOGLE_CLIENT_ID` is set and correct

**Checkout page blank**
→ Check browser console (F12) for errors
→ Verify backend is running: `curl http://localhost:8000/api/products/`

**Webhook not working**
→ Make sure webhook URL is publicly accessible
→ Test with curl: `curl -X POST http://localhost:8000/api/cashfree/webhook/ -d '{"order_id":"test"}'`

## 📖 For More Details

See:
- `CASHFREE_MIGRATION_GUIDE.md` - Full migration guide
- `CASHFREE_COMPLETION_SUMMARY.md` - What changed
- `SYSTEM_ARCHITECTURE.md` - System design

---

**Status**: ✅ Ready to Deploy  
**Estimated Setup Time**: 5 minutes
**Support**: Check documentation or review code comments
