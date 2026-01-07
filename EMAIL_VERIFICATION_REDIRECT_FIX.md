# Email Verification Redirect Fix ✅

## Problem

After email verification, the app would redirect to the wrong Expo instance, opening a different development app instead of the current one.

## Root Causes

1. **Hardcoded IP address** - Backend was using `exp://192.168.1.22:8081` which may not match the actual dev instance
2. **Incorrect deep link scheme** - Was using `exp://` URL format instead of the app's custom scheme
3. **No fallback mechanism** - Single redirect method with no alternatives if the primary method failed

## Solution Implemented

### 1. Backend Changes (`server/src/routes/auth.ts`)

- **Changed redirect method** from `exp://192.168.1.22:8081` to `exoptus://` custom scheme
  - Custom schemes registered in `app.json` with `"scheme": "exoptus"`
  - Works with both Expo Go (development) and built apps (production)
- **Added fallback mechanism** for Expo Go compatibility
  - Primary: `exoptus://auth/verify?jwt=...&user=...&redirectTo=...`
  - Fallback: Expo.dev launcher URL if custom scheme times out
- **Improved HTML redirect logic**
  - 300ms delay for first attempt (custom scheme)
  - 1500ms fallback to Expo Go launcher URL
  - Manual button click option
  - Better error logging

### 2. App Changes (`hooks/useDeepLinkAuth.ts`)

- **Enhanced path matching** with more robust URL parsing

  - Checks for `auth/verify` in multiple ways
  - Logs parsed path for debugging
  - Better variable naming for clarity

- **Improved logging** for troubleshooting
  - Shows full URL and parsed path
  - Displays all available parameters
  - Clear indication of which verification path is taken

### 3. Configuration (`app.json`)

- Custom scheme `"exoptus"` is already configured
- Matches the deep link handler in the app

## How It Works Now

1. **User clicks email verification link**

   - Backend receives verification request
   - Validates token and creates JWT
   - Generates deep link: `exoptus://auth/verify?jwt=...&user=...`

2. **Browser redirects to app**

   - JavaScript attempts immediate custom scheme redirect
   - If that fails (300ms), tries Expo Go launcher URL fallback
   - User can also click the "Open Exoptus App" button

3. **App receives deep link**
   - `useDeepLinkAuth` hook intercepts the URL
   - Parses JWT and user data
   - Routes to `/(auth)/verifying` screen
   - Verifying screen animates and shows "Continue" button
   - User continues to onboarding or home

## Testing

### Development (Expo Go)

```bash
# Start the Expo dev server
npx expo start --port 8082

# Start the backend
cd server && npm run dev

# Test: Send test email with verification link
# Click link from email → should redirect to your Expo Go instance
```

### Testing the Redirect

1. Go to signup
2. Enter email address
3. Check email for verification link
4. Click the link
5. **Expected**: Browser shows success page, then redirects to your exact Expo instance
6. **Should see**: Verifying screen with your verification data

## Debugging

If redirect still doesn't work:

1. **Check app.json scheme**

   ```json
   "scheme": "exoptus"  // Must be set
   ```

2. **Verify deep link logs** in Expo console

   - Look for "🔗 Deep link received:" messages
   - Check parsed path and parameters

3. **Test custom scheme manually**

   - Try opening `exoptus://auth/verify?jwt=test` in browser
   - Should attempt to open the app

4. **Check backend logs**
   - Look for "Email verified for..." success message
   - Verify JWT and user data are being generated

## Files Modified

- `server/src/routes/auth.ts` - Redirect logic and HTML response
- `hooks/useDeepLinkAuth.ts` - Deep link parsing and routing
- `app.json` - Already had correct scheme configuration
