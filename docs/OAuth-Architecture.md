# Production OAuth Architecture - EXOPTUS

## Overview

This document describes the production-grade OAuth architecture implemented for EXOPTUS using:

- **Expo AuthSession** for system browser OAuth
- **WebBrowser** for lifecycle management
- **Server-side token exchange** with jose verification
- **Secure token storage** with expo-secure-store
- **Deep linking** for JWT callback

## Architecture Diagram

```
Expo App
├─ [Sign In Button]
│  └─ Calls: signInWithGoogle()
│
├─ AuthSession
│  └─ Opens System Browser
│      └─ https://backend/auth/google/start
│          └─ Redirects to Google OAuth
│              └─ User logs in at Google
│                  └─ Redirects to /auth/google/callback with code
│
├─ Backend (Node.js)
│  ├─ POST /auth/google/callback
│  │  ├─ Receives: auth code from Google
│  │  ├─ Exchanges code for Google ID token
│  │  ├─ Verifies ID token signature with jose
│  │  ├─ Creates/links user account
│  │  └─ Issues Exoptus JWT
│  │
│  └─ Redirects: googleoauthexoptus://auth?token=JWT
│
└─ Deep Link Handler
   ├─ Receives JWT in URL params
   ├─ Stores in SecureStore
   ├─ Sets API auth header
   ├─ Fetches user profile
   └─ Routes to onboarding or home
```

## Key Security Features

### 1. Token Exchange Happens Server-Side

**Why this matters:**

- Google credentials never touch the client
- Client secret stays protected
- Reduces attack surface

**Implementation:**

```
Client → Browser → Backend (code) → Google (token) → Backend (verify)
```

### 2. JWT Verification with Jose

**What happens:**

1. Backend receives auth code from Google
2. Exchanges code for ID token
3. **Verifies token signature** using Google's public keys
4. **Validates token claims** (issuer, audience, expiration)

**Code:**

```typescript
const verified = await jwtVerify(idToken, publicKey, {
  issuer: ["https://accounts.google.com"],
  audience: clientId,
});
```

### 3. Secure Token Storage

**Tokens are stored:**

- **JWT token** → `expo-secure-store` (encrypted)
- **User data** → `expo-secure-store` (encrypted)
- **API calls** → Bearer token in Authorization header

**Never stored:**

- LocalStorage (unencrypted)
- AsyncStorage (unencrypted on Android)
- In Redux/Zustand state (lost on app restart)

### 4. Deep Link Flow

**Callback URL:**

```
googleoauthexoptus://auth?token=eyJhbGc...
```

**Why this URL scheme:**

- Matches `app.json` scheme: `"scheme": "googleoauthexoptus"`
- Allows system browser to redirect back to app
- Works in Expo Go and production APK

## Configuration

### 1. app.json

```json
{
  "expo": {
    "scheme": "googleoauthexoptus",
    "android": {
      "package": "com.exoptus.app"
    }
  }
}
```

### 2. Google Console

**Redirect URI (CRITICAL):**

```
https://exoptus-server-production.up.railway.app/auth/google/callback
```

**Do NOT use:**

- Expo deep links (googleoauthexoptus://...)
- Localhost
- ngrok temporary URLs
- Vercel domains

### 3. Environment Variables

**Frontend (app environment):**

```
EXPO_PUBLIC_API_URL=https://exoptus-server-production.up.railway.app
```

**Backend (.env):**

```
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
SERVER_URL=https://exoptus-server-production.up.railway.app
```

## Implementation Guide

### Step 1: Start OAuth (Client)

```typescript
import { useAuthSession } from "../../services/authSession";

export function LoginScreen() {
  const { signInWithGoogle } = useAuthSession();

  const handleLogin = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      // JWT is stored in SecureStore
      // Deep link handler routes the user
    }
  };
}
```

### Step 2: Backend Starts Auth Flow

```typescript
// GET /auth/google/start
router.get("/google/start", (req: Request, res: Response) => {
  const redirectUri = req.query.redirect; // From Expo
  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  // Add all params...
  res.redirect(googleUrl.toString());
});
```

### Step 3: Backend Exchanges Code

```typescript
// GET /auth/google/callback
router.get("/google/callback", async (req: Request, res: Response) => {
  // Step 1: Get auth code
  const { code } = req.query;

  // Step 2: Exchange for token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  // Step 3: Verify with jose
  const verified = await jwtVerify(idToken, publicKey, {
    issuer: ["https://accounts.google.com"],
    audience: clientId,
  });

  // Step 4: Create user
  // Step 5: Issue JWT
  // Step 6: Redirect to app
  res.redirect(`googleoauthexoptus://auth?token=${jwtToken}`);
});
```

### Step 4: Handle Deep Link (Client)

```typescript
// hooks/useDeepLinkAuth.ts
useEffect(() => {
  const handleDeepLink = async ({ url }: { url: string }) => {
    const parsed = Linking.parse(url);
    const token = parsed.queryParams?.token;

    if (token) {
      // Store JWT
      await SecureStore.setItemAsync(TOKEN_KEY, token);

      // Verify session
      api.setAuthToken(token);
      const user = await api.get("/user/profile");

      // Route user
      router.replace(getRoutePath(user));
    }
  };

  Linking.addEventListener("url", handleDeepLink);
}, []);
```

## Testing Checklist

### Test in Expo Go

```bash
# Terminal 1: Backend
npm run dev -w exoptus-server

# Terminal 2: Expo Go
npx expo start

# On device: Scan QR code
# Press "Google" button → should open system browser
# Log in to Google
# Should redirect back to app
# Check: Token stored in SecureStore
```

### Test in APK Build

```bash
# Build APK
npx expo run:android

# Or use EAS Build
eas build --platform android

# Install and test
# Ensure redirect URI resolves correctly
# Verify deep link works
```

### Network Debug

```bash
# Check what URLs are being called
adb logcat | grep -i "google\|oauth\|exoptus"

# Verify redirects
curl https://exoptus-server.up.railway.app/auth/google/callback \
  -H "Location" 2>&1 | grep -i location
```

## Troubleshooting

### "Failed to exchange code"

**Possible causes:**

- Google Client ID/Secret incorrect
- Redirect URI doesn't match Google Console
- Server not responding

**Debug:**

```bash
# Test token exchange manually
curl -X POST https://oauth2.googleapis.com/token \
  -d "code=AUTH_CODE&client_id=...&client_secret=...&redirect_uri=..."
```

### "Token verification failed"

**Possible causes:**

- Google's public keys not fetched
- Token signature invalid
- Token already expired

**Debug:**

```typescript
// In backend route
try {
  const verified = await jwtVerify(...);
  console.log("✅ Token verified:", verified.payload);
} catch (err) {
  console.error("❌ Verification failed:", err.message);
}
```

### "Deep link not opening app"

**Possible causes:**

- `app.json` scheme doesn't match
- App not built with correct scheme
- Deep link URL has wrong format

**Debug:**

```bash
# Test deep link locally
adb shell am start -W -a android.intent.action.VIEW \
  -d "googleoauthexoptus://auth?token=test" com.exoptus.app
```

### "JWT not in SecureStore"

**Possible causes:**

- `useDeepLinkAuth()` hook not installed
- Linking event not firing
- URL not parsed correctly

**Debug:**

```typescript
// Add logging in useDeepLinkAuth
Linking.addEventListener("url", (event) => {
  console.log("🔗 Deep link received:", event.url);
  const parsed = Linking.parse(event.url);
  console.log("📝 Parsed params:", parsed.queryParams);
});
```

## Performance Notes

### OAuth Flow Time

| Step               | Time       | Notes           |
| ------------------ | ---------- | --------------- |
| User taps button   | 0ms        | Instant         |
| Browser opens      | 200-500ms  | System overhead |
| Google login       | 10-30s     | User dependent  |
| Code exchange      | 500-1000ms | Network latency |
| JWT issued         | 100-200ms  | Database query  |
| Deep link redirect | 100-300ms  | System overhead |
| **Total**          | **15-35s** | User experience |

### Optimize For:

1. **First load:** Cache token in SecureStore
2. **Session resume:** Check token validity before re-auth
3. **Failed auth:** Clear token immediately

## Migration from Old System

If migrating from the old Google SDK approach:

1. **Remove:** `@react-native-google-signin/google-signin`
2. **Remove:** Direct Google ID token handling in client
3. **Add:** `useAuthSession()` hook to login screens
4. **Update:** Google redirect URI in console
5. **Test:** All OAuth flows in Expo Go and APK

## Future Improvements

- [ ] Refresh token support for long-lived sessions
- [ ] Biometric auth for returning users
- [ ] Account switching (multiple Google accounts)
- [ ] Federation with other OAuth providers (Apple, GitHub)
- [ ] 2FA support at backend level
