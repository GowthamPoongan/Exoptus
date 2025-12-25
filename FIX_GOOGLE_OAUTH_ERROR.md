# 🔧 FIX: Google OAuth Authorization Error

## ❌ Error You're Seeing:

```
Access blocked: Authorization Error
Error 400: invalid_request
App doesn't comply with Google's OAuth 2.0 policy
```

## 🎯 Root Cause:

The **Redirect URI** that Expo is sending doesn't match what's registered in your Google Cloud Console.

---

## ✅ SOLUTION: Add Correct Redirect URIs

### Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com/apis/credentials
2. Select your project (the one with Client ID: `463755159994-qh29mpi9dsbp90gf5id3q3id1m3eluie`)
3. Click on your **OAuth 2.0 Client ID**

### Step 2: Add These Redirect URIs

In the **Authorized redirect URIs** section, click **+ ADD URI** and add these **EXACT** URIs:

#### For Expo Go Development:

```
https://auth.expo.io/@anonymous/exoptus
```

#### If you have Expo account (replace with your username):

```
https://auth.expo.io/@YOUR_EXPO_USERNAME/exoptus
```

#### For Standalone App:

```
exoptus://oauth
exoptus://
com.exoptus.app://oauth
```

#### For Web/Local Testing:

```
http://localhost:3000/auth/google
http://10.175.216.47:3000/auth/google
https://localhost:3000/auth/google
```

**Click SAVE** at the bottom!

---

## 🔍 How to Find Your Exact Redirect URI

### Option 1: Check Expo Output

When you run `npx expo start` and try Google sign-in, the error message from Google will show the **actual redirect URI** being used. Copy that exact URI and add it to Google Cloud Console.

### Option 2: Use Expo CLI

```powershell
npx expo config --type public
```

Look for the `scheme` value (should be: `exoptus`)

---

## 📋 Additional Google Cloud Console Setup

### 1. OAuth Consent Screen

Go to: https://console.cloud.google.com/apis/credentials/consent

**Configure these settings:**

- **User Type:** External (or Internal if using Google Workspace)
- **App name:** Exoptus
- **User support email:** gowthampoongan@gmail.com
- **App logo:** (optional)
- **App domain - Authorized domains:** (leave empty for testing)
- **Developer contact:** gowthampoongan@gmail.com

**Scopes:**

- `email` - See your primary Google Account email address
- `profile` - See your personal info
- `openid` - Authenticate using OpenID Connect

**Test users (if app is in Testing mode):**
Add your email: `gowthampoongan@gmail.com`

Click **SAVE AND CONTINUE** through all steps.

### 2. Publishing Status

**For Testing:**

- Status: Testing
- Add yourself as test user: gowthampoongan@gmail.com
- No verification needed

**For Production (later):**

- You'll need to submit for verification
- But for development, keep it in Testing mode

---

## 🔄 Complete Setup Checklist

Go through each step in Google Cloud Console:

### Credentials Page:

- [ ] OAuth 2.0 Client ID exists: `463755159994-qh29mpi9dsbp90gf5id3q3id1m3eluie`
- [ ] Application type: Web application (or create new iOS/Android)
- [ ] **Authorized redirect URIs** includes:
  - [ ] `https://auth.expo.io/@anonymous/exoptus`
  - [ ] `exoptus://oauth`
  - [ ] `com.exoptus.app://oauth`
  - [ ] `http://localhost:3000/auth/google`

### OAuth Consent Screen:

- [ ] App name: Exoptus
- [ ] User support email: gowthampoongan@gmail.com
- [ ] Scopes added: email, profile, openid
- [ ] Publishing status: Testing
- [ ] Test users includes: gowthampoongan@gmail.com

---

## 🧪 Test After Setup

### Step 1: Wait 5 Minutes

Google Cloud changes can take a few minutes to propagate.

### Step 2: Clear App Cache

```powershell
# Stop Expo if running (Ctrl+C)
npx expo start --clear
```

### Step 3: Try Google Sign-In Again

1. Open app in Expo Go
2. Click "Continue with Google"
3. Select your account
4. Should work now! ✅

---

## 🐛 Still Getting Error?

### Check the Actual Redirect URI:

1. Try signing in with Google
2. When you get the error, look at the URL or error message
3. It will show: **redirect_uri=SOME_URL**
4. Copy that EXACT URL
5. Add it to Google Cloud Console → Authorized redirect URIs

### Common Redirect URIs for Expo:

- `https://auth.expo.io/@anonymous/exoptus` (most common for Expo Go)
- `https://auth.expo.io/@YOUR_USERNAME/exoptus` (if logged into Expo)
- `exoptus://` (for standalone builds)

---

## 📝 Alternative: Use Authorization Code Flow

If the above doesn't work, you might need to create **separate client IDs** for different platforms:

### Create Multiple OAuth Clients:

1. **For Expo/Web:**

   - Type: Web application
   - Redirect URI: `https://auth.expo.io/@anonymous/exoptus`

2. **For Android:**

   - Type: Android
   - Package name: `com.exoptus.app`
   - SHA-1: Get from `npx expo credentials:manager`

3. **For iOS:**
   - Type: iOS
   - Bundle ID: `com.exoptus.app`

Then update your [welcome.tsx](<app/(auth)/welcome.tsx>) with the different client IDs.

---

## 🎯 Quick Fix Summary

**Most likely you just need to:**

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add redirect URI: `https://auth.expo.io/@anonymous/exoptus`
4. Save
5. Wait 2-5 minutes
6. Clear Expo cache: `npx expo start --clear`
7. Try again

**This should fix it!** 🚀

---

## 📞 Need Help?

If still not working, please share:

1. Screenshot of your "Authorized redirect URIs" section in Google Cloud Console
2. The exact error URL/redirect_uri from the error message
