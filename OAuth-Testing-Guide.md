# Quick Start: OAuth Testing Guide

## Prerequisites

- [ ] Backend environment variables set (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- [ ] Google redirect URI configured in Google Console: `https://exoptus-server.up.railway.app/auth/google/callback`
- [ ] Backend running: `npm run dev -w exoptus-server`
- [ ] Frontend dependencies installed: `npm install`

## Test 1: Expo Go (Fastest)

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start Expo
npx expo start

# On phone: Scan QR code to open in Expo Go
# Press the "Continue with Google" button
```

### Expected flow:

1. System browser opens → Google login page
2. User logs in
3. Browser redirects back to your app
4. Welcome screen closes
5. Either:
   - Onboarding chat (first time)
   - Home screen (returning user)

### Debug checklist:

```typescript
// Check 1: Is useDeepLinkAuth running?
// Add in app/_layout.tsx:
useDeepLinkAuth(); // Should be called

// Check 2: Is AuthSession available?
// In services/authSession.ts:
const redirectUri = AuthSession.makeRedirectUri({
  scheme: "googleoauthexoptus",
  path: "auth",
});
console.log("Redirect URI:", redirectUri);
// Should output: googleoauthexoptus://auth (or dev equivalent)

// Check 3: Is token being stored?
// After successful OAuth:
const token = await SecureStore.getItemAsync("exoptus_auth_token");
console.log("Token stored:", !!token);
// Should be: true
```

## Test 2: APK/Dev Build

```bash
# Build APK with prebuild
npx expo prebuild --clean

# Run on Android device
npx expo run:android

# Test Google sign-in
# All flow should be identical to Expo Go
```

### Verify deep link works:

```bash
# Manually test deep link
adb shell am start -W -a android.intent.action.VIEW \
  -d "googleoauthexoptus://auth?token=test_token" \
  com.exoptus.app

# Should open app with JWT test (won't actually authenticate)
```

## Test 3: Network Flow

### Check backend is reachable:

```bash
# From your phone/simulator
curl -X GET https://exoptus-server-production.up.railway.app/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-05T..."}
```

### Check Google OAuth endpoints:

```bash
# Start Google OAuth
curl -i "https://exoptus-server-production.up.railway.app/auth/google/start?redirect=googleoauthexoptus%3A%2F%2Fauth"

# Should redirect (301/302) to Google
```

### Check callback returns JWT:

```bash
# This won't work directly (needs real auth code from Google)
# But you can verify the route exists:
curl -X GET https://exoptus-server-production.up.railway.app/auth/google/callback

# Should return HTML error page (no code provided)
# Not: 404 Not Found
```

## Test 4: Manual Token Verification

```typescript
// Test in your backend (test-oauth.ts)
import { jwtVerify, importSPKI } from "jose";

async function testTokenVerification() {
  // Get Google's public keys
  const keyResponse = await fetch("https://www.googleapis.com/oauth2/v1/certs");
  const keys = await keyResponse.json();
  console.log("Google keys available:", Object.keys(keys).length);

  // Log first key for debugging
  const firstKey = Object.values(keys)[0];
  console.log("Sample key format:", firstKey?.substring(0, 50) + "...");
}

testTokenVerification();
```

## Test 5: End-to-End Flow

```bash
# Prerequisites: All the above working

# 1. Clear any stored tokens
# Device storage → clear Exoptus app data

# 2. Open app
npx expo start

# 3. Tap "Continue with Google" button

# 4. Check browser opened with correct URL
# Log: "🔗 Redirecting to: https://accounts.google.com/..."

# 5. Log in with Google test account

# 6. Check redirect back to app
# Log: "🔗 Deep link received: googleoauthexoptus://auth?token=..."

# 7. Check token stored
# Log: "✅ Token extracted from deep link"

# 8. Check user fetched
# Log: "✅ Authenticated as: [email]"

# 9. Check correct routing
# First time: Should go to onboarding chat
# Returning: Should go to home screen
```

## Common Issues & Fixes

### Issue: Browser doesn't open

**Check:**

```typescript
// In services/authSession.ts, signInWithGoogle()
const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
console.log("Browser result type:", result.type);
// Should be: "success" or "dismiss"
```

**Fix:**

- Ensure `expo-web-browser` is installed
- Verify `authUrl` is a valid HTTPS URL
- Check device has a browser app

### Issue: Redirect URI mismatch

**Check Google Console:**

1. Go to Google Cloud Console
2. OAuth 2.0 Credentials
3. Find the exoptus app credential
4. Verify Authorized redirect URIs includes:
   ```
   https://exoptus-server-production.up.railway.app/auth/google/callback
   ```

**Note:** This is the backend callback, NOT the app scheme.

### Issue: Token not stored after sign-in

**Check:**

```typescript
// In hooks/useDeepLinkAuth.ts
console.log("🔗 Deep link received:", url);
// If you don't see this, deep link isn't working

// Manually test redirect:
Linking.openURL("googleoauthexoptus://auth?token=test_token");
// Should print the log above
```

**Fix:**

- Verify `app.json` scheme is `"googleoauthexoptus"`
- Rebuild app: `expo prebuild --clean`
- Test deep link with `adb shell am start`

### Issue: "Invalid token" error

**Check backend logs:**

```bash
# SSH into Railway container
railway run bash

# Check logs
tail -f logs/application.log | grep -i token
```

**Common causes:**

- Token expired (Google tokens are ~1 hour)
- Token signature can't be verified
- Google's public keys can't be fetched

**Fix:**

- Check network connectivity on server
- Verify GOOGLE_CLIENT_ID environment variable
- Clear any cached tokens

## What to Verify After Implementation

- [ ] Scheme in `app.json` is `"googleoauthexoptus"`
- [ ] Android package in `app.json` is `"com.exoptus.app"`
- [ ] Backend environment variables are set
- [ ] Google redirect URI includes `/auth/google/callback`
- [ ] `useDeepLinkAuth()` is called in root layout
- [ ] `signInWithGoogle()` is called from login button
- [ ] `SecureStore` is used, not `AsyncStorage`
- [ ] No native Google SDK imports in welcome screen
- [ ] JWT is verified with `jose` on backend
- [ ] Deep link handler routes to correct screen

## Performance Expectations

| Metric        | Expected | Acceptable |
| ------------- | -------- | ---------- |
| Browser open  | <500ms   | <1s        |
| Code exchange | <1s      | <2s        |
| User fetch    | <500ms   | <1s        |
| Route change  | <300ms   | <1s        |
| **Total**     | ~3-5s    | <15s       |

The user will spend most time on the Google login page itself (10-30s).

## Next Steps

1. ✅ Implement OAuth flow (done)
2. 🟡 Test in Expo Go and APK
3. 🟡 Get production certificate from Google
4. 🟡 Deploy backend to production
5. 🟡 Release APK to Play Store
6. 🟡 Monitor OAuth success rates

---

**Questions?** Check:

- [OAuth Architecture Doc](./OAuth-Architecture.md)
- Backend logs: `railway run bash` then `tail -f logs/`
- Expo logs: Check terminal output
- DevTools: Expo menu → Logs
