# Expo OAuth Proxy - Student Workflow ✅

## The Right Way: Use Expo's OAuth Proxy

Google doesn't trust raw IPs or localhost. But **Google DOES trust Expo** because it's a legitimate public HTTPS service.

### Why This Works

1. **Expo is a trusted OAuth proxy** - Google recognizes `auth.expo.io` as a public domain
2. **No localhost issues** - Expo handles HTTPS and domain management
3. **Seamless Expo Go testing** - Works directly in the Expo Go app
4. **Simple production switch** - APK just uses the app scheme directly

---

## Phase 1: Development (Expo Go) ✅

### Step 1: Add to Google Cloud Console

```
https://auth.expo.io/@exoptus/exoptus
```

**Steps:**

1. [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services → Credentials**
3. Click your OAuth 2.0 Client ID
4. Add this authorized redirect URI:
   ```
   https://auth.expo.io/@exoptus/exoptus
   ```
5. **Save**

### Step 2: Backend Configuration

**`server/.env`:**

```env
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
SERVER_URL="http://localhost:3000"
```

The backend doesn't need to know about the Expo proxy - it just receives the app's redirect from Expo.

### Step 3: Frontend Configuration

**`.env`:**

```env
EXPO_PUBLIC_API_URL="http://localhost:3000"
EXPO_PUBLIC_APP_MODE="development"
```

### Step 4: Code Configuration

**`services/authSession.ts`:**

```typescript
const isDevelopment = process.env.EXPO_PUBLIC_APP_MODE === "development";

const redirectUri = AuthSession.makeRedirectUri({
  useProxy: isDevelopment, // ✅ Uses https://auth.expo.io/@username/app
  scheme: isDevelopment ? undefined : "googleoauthexoptus",
  path: "auth",
});
```

### How It Works

```
1. App calls signInWithGoogle()
   ↓
2. AuthSession.makeRedirectUri({ useProxy: true })
   → Returns: https://auth.expo.io/@exoptus/exoptus
   ↓
3. Backend opens: http://localhost:3000/auth/google/start?redirect=<expo_uri>
   ↓
4. Backend redirects to Google OAuth consent
   ↓
5. Google redirects to: https://auth.expo.io/@exoptus/exoptus?code=...
   ↓
6. Expo intercepts, extracts code, sends back to app via deep link
   ↓
7. App receives deep link with JWT token ✅
```

---

## Phase 2: Production (APK/IPA)

### Step 1: Add Production Redirect URI

When deploying to Railway (or your backend):

```
https://exoptus-server-production.up.railway.app/auth/google/callback
```

Add to Google Cloud Console alongside the Expo proxy URI.

### Step 2: Production Configuration

**`server/.env` (production):**

```env
GOOGLE_REDIRECT_URI="https://exoptus-server-production.up.railway.app/auth/google/callback"
SERVER_URL="https://exoptus-server-production.up.railway.app"
```

**`.env` (production):**

```env
EXPO_PUBLIC_API_URL="https://exoptus-server-production.up.railway.app"
EXPO_PUBLIC_APP_MODE="production"
```

### Step 3: Code Automatically Switches

**`services/authSession.ts`:**

```typescript
const isDevelopment = process.env.EXPO_PUBLIC_APP_MODE === "development";

const redirectUri = AuthSession.makeRedirectUri({
  useProxy: isDevelopment, // ❌ false in production
  scheme: isDevelopment ? undefined : "googleoauthexoptus", // ✅ uses custom scheme
  path: "auth",
});
```

### How It Works (Production)

```
1. APK is installed - NOT running in Expo Go
   ↓
2. AuthSession.makeRedirectUri({ useProxy: false })
   → Returns: googleoauthexoptus://auth
   ↓
3. App calls: https://exoptus-server.../auth/google/start?redirect=googleoauthexoptus://auth
   ↓
4. Browser opens Google OAuth
   ↓
5. Google redirects to: googleoauthexoptus://auth?token=<jwt>
   ↓
6. Android deep link handler receives the redirect ✅
   ↓
7. App parses JWT from URL and authenticates ✅
```

---

## Verification Checklist

### Development (Expo Go)

- [ ] Backend running: `npm run dev:server`
- [ ] Mobile running: `npm run dev:mobile`
- [ ] Google Console has: `https://auth.expo.io/@exoptus/exoptus`
- [ ] Click "Sign in with Google" in app
- [ ] Browser opens Google login ✅
- [ ] Redirected back to Expo app ✅
- [ ] App shows home screen or onboarding ✅

### Production (APK)

- [ ] Built APK: `eas build --platform android`
- [ ] Google Console has: `https://your-backend.../auth/google/callback`
- [ ] Install APK on physical device
- [ ] Click "Sign in with Google"
- [ ] Browser opens Google login ✅
- [ ] App deep link receives JWT ✅
- [ ] App authenticates and routes ✅

---

## Why This Is Better Than Alternatives

| Method            | Works in Expo Go? | Works on APK? | Requires ngrok? | Google Accepts?   |
| ----------------- | ----------------- | ------------- | --------------- | ----------------- |
| **Expo Proxy** ✅ | ✅ Yes            | ✅ Yes        | ❌ No           | ✅ Yes            |
| localhost         | ✅ Yes            | ❌ No         | ❌ No           | ✅ Yes (dev only) |
| Raw IP            | ❌ No             | ❌ No         | ❌ No           | ❌ No             |
| .local domain     | ❌ No             | ❌ No         | ❌ No           | ❌ No             |
| ngrok             | ✅ Yes            | ✅ Yes        | ✅ Yes          | ✅ Yes            |

**Expo Proxy wins because:**

- No external tools (ngrok)
- Works on both Expo Go and production APK
- Google officially supports it
- Zero configuration in app code (uses EXPO_PUBLIC_APP_MODE)

---

## Current Configuration

### `.env` (Frontend)

```env
EXPO_PUBLIC_API_URL="http://localhost:3000"
EXPO_PUBLIC_APP_MODE="development"
```

### `server/.env` (Backend)

```env
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
SERVER_URL="http://localhost:3000"
```

### `services/authSession.ts` (Automatically detects mode)

```typescript
const isDevelopment = process.env.EXPO_PUBLIC_APP_MODE === "development";
const redirectUri = AuthSession.makeRedirectUri({
  useProxy: isDevelopment, // Proxy for Expo Go: https://auth.expo.io/@exoptus/exoptus
  scheme: isDevelopment ? undefined : "googleoauthexoptus", // Custom scheme for APK
  path: "auth",
});
```

---

## Next Steps

1. ✅ Update Google Cloud Console with: `https://auth.expo.io/@exoptus/exoptus`
2. ✅ Restart backend: `npm run dev:server`
3. ✅ Restart mobile: `npm run dev:mobile`
4. ✅ Test OAuth flow in Expo Go
5. ✅ When ready: Deploy to Railway and update production URLs

---

**Status: Ready for Testing** ✅

This is the correct student workflow used by Expo developers worldwide.
