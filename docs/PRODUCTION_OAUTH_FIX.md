# LinkedIn OAuth Production Fix - WWW Subdomain Issue

## Issue Diagnosis
**Error**: "The redirect_uri does not match the registered value"
**Root Cause**: Production domain uses `www.okbuddy.io` but OAuth configuration used `okbuddy.io` (missing www subdomain)

## Fix Applied

### 1. Code Changes ✅
- Updated `LinkedInOAuthProvider.ts` to automatically use correct production URL
- Added environment-aware redirect URI logic

### 2. Environment Configuration ✅  
- Updated all documentation with correct production URLs
- Added production redirect URIs to environment templates

### 3. Required Production Setup

#### **CRITICAL**: Update LinkedIn Developer App
You must update your LinkedIn Developer app at https://www.linkedin.com/developers/apps

**Add this redirect URL**:
```
https://www.okbuddy.io/api/auth/linkedin/callback
```

#### **CRITICAL**: Set Production Environment Variables
In your Vercel deployment, set:
```
LINKEDIN_REDIRECT_URI=https://www.okbuddy.io/api/auth/linkedin/callback
GOOGLE_REDIRECT_URI=https://www.okbuddy.io/api/auth/google/callback
```

## Testing Instructions

1. **LinkedIn Developer Portal**:
   - Go to your app settings
   - Navigate to "Auth" tab
   - Ensure both URLs are listed:
     - `http://localhost:3000/api/auth/linkedin/callback` (development)
     - `https://www.okbuddy.io/api/auth/linkedin/callback` (production)

2. **Production Test**:
   - Visit https://www.okbuddy.io/login
   - Click "Continue with LinkedIn"
   - Should redirect properly without redirect_uri error

## Files Modified
- `lib/auth/oauth/providers/LinkedInOAuthProvider.ts`
- `docs/env-template.txt`
- `docs/environment-config.env`
- `oauth-setup-guide.md`
- `OAUTH_SETUP_INSTRUCTIONS.md`

## Status
- ✅ Code fixed and tested (build successful)
- ⏳ **PENDING**: Production environment variable update
- ⏳ **PENDING**: LinkedIn Developer app redirect URI update