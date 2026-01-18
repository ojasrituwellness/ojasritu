# Google Sign-In Fix - Diagnostic & Solution

## Problem
Google Sign-In not working on production (https://ojasritu.co.in)

## Root Cause Analysis

### Backend Issues:
1. ✅ Custom Google OAuth endpoint exists at `/api/auth/google/` (shop/auth_views.py)
2. ❓ `GOOGLE_CLIENT_ID` environment variable may not be set on Railway
3. ✅ Django allauth is installed but frontend uses custom endpoint
4. ✅ CSRF/CORS configured correctly

### Frontend Issues:
1. ✅ VITE_GOOGLE_CLIENT_ID is set in `.env` (dev only)
2. ❓ Production build may not have access to this env var
3. ✅ OAuth callback routes added to App.jsx

## Solution Steps

### 1. Set Railway Environment Variables
You need to add these to Railway dashboard:

```bash
GOOGLE_CLIENT_ID=160064592375-th350ndi77t1od7md3d75fuf5gckhdu0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-secret-from-google-console>
```

**How to add:**
1. Go to https://railway.app/dashboard
2. Select your project: Ojasritu-Wellness
3. Go to Variables tab
4. Click "+ New Variable"
5. Add both variables above

### 2. Verify Google Console Settings
Go to: https://console.cloud.google.com/apis/credentials

**Authorized JavaScript origins:**
- `https://ojasritu.co.in`
- `https://www.ojasritu.co.in`
- `http://localhost:5173` (for dev)

**Authorized redirect URIs:**
- `https://ojasritu.co.in/api/auth/google/`
- `https://www.ojasritu.co.in/api/auth/google/`
- `https://ojasritu.co.in/accounts/google/login/callback/`
- `http://localhost:5173` (for dev)

### 3. Frontend Production Build
The frontend needs VITE_GOOGLE_CLIENT_ID at build time.

Railway build command should be:
```bash
cd frontend && VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID npm run build
```

**Update this in:**
- `Dockerfile` (line where frontend is built)
- OR Railway dashboard build command

### 4. Test Locally
```bash
# Backend
python manage.py runserver

# Frontend (new terminal)
cd frontend
npm run dev
```

Try Google login - it should work locally.

## Current Code Status

### ✅ Already Fixed:
1. OAuth callback routes added to App.jsx
2. Login.jsx always redirects to home after Google auth
3. CSRF_TRUSTED_ORIGINS includes production domains
4. SOCIAL_AUTH_* redirect URLs set in settings.py

### ⚠️ Needs Action (Railway Dashboard):
1. Add GOOGLE_CLIENT_ID env var
2. Add GOOGLE_CLIENT_SECRET env var
3. Update build command to pass VITE_GOOGLE_CLIENT_ID

## Quick Deploy Command

After setting Railway env vars:
```bash
git push origin ojasritu
```

Railway will auto-deploy. Wait 2-3 minutes, then test Google login.

## Debug Checklist

If still not working after deploy:
1. Open browser console on https://ojasritu.co.in/login
2. Check for errors (F12 → Console)
3. Look for: "Google OAuth not initialized" or "VITE_GOOGLE_CLIENT_ID is not set"
4. Check Network tab for failed `/api/auth/google/` request
5. Verify Railway logs don't show "GOOGLE_CLIENT_ID not configured"

## Contact
If issue persists, check:
- Railway deployment logs
- Browser console errors
- Network requests to `/api/auth/google/`
