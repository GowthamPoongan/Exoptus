# 🔧 COMPLETE GOOGLE OAUTH CONSENT SCREEN SETUP

## ❌ Error You're Getting:

```
Error 400: invalid_request
App doesn't comply with Google's OAuth 2.0 policy
```

## ✅ ROOT CAUSE & FIX

This error means your **OAuth Consent Screen** is incomplete or not properly saved.

---

## 📋 STEP-BY-STEP FIX

### 1. Go to OAuth Consent Screen

🔗 https://console.cloud.google.com/apis/credentials/consent

---

### 2. Fill Out EVERY Required Field

#### **App Information:**

- ✅ **App name:** `Exoptus`
- ✅ **User support email:** `gowthampoongan@gmail.com`
- ✅ **App logo:** (optional - can skip)

#### **App Domain (Optional but recommended):**

- **Application home page:** (leave empty for testing)
- **Application privacy policy link:** (leave empty for testing)
- **Application terms of service link:** (leave empty for testing)

#### **Authorized Domains:**

- Leave EMPTY for now (not required for testing)

#### **Developer Contact Information:**

- ✅ **Email addresses:** `gowthampoongan@gmail.com`

**Click SAVE AND CONTINUE**

---

### 3. Configure Scopes (CRITICAL!)

**Click "ADD OR REMOVE SCOPES"**

**Select these THREE scopes (required):**

- ✅ `.../auth/userinfo.email` - See your primary Google Account email address
- ✅ `.../auth/userinfo.profile` - See your personal info
- ✅ `openid` - Associate you with your personal info on Google

**Click UPDATE** at bottom

**Click SAVE AND CONTINUE**

---

### 4. Add Test Users

**Click "+ ADD USERS"**

**Add BOTH emails:**

```
kidslaughing200@gmail.com
gowthampoongan@gmail.com
```

**Click ADD**

**Click SAVE AND CONTINUE**

---

### 5. Review and Confirm

- Review all information
- **Click "BACK TO DASHBOARD"**

---

### 6. Verify Publishing Status

On the OAuth consent screen page, check:

**Publishing status:** Should show:

- ✅ **"Testing"** (with warning icon)
- OR **"In production"** (if verified)

**If it says "Not Published" or shows errors:**

- Go back through steps 2-4
- Make sure ALL required fields are filled
- Click SAVE on each page

---

## 🔍 CRITICAL CHECKLIST

Before testing, verify these are ALL checked:

**OAuth Consent Screen page:**

- [ ] App name: "Exoptus"
- [ ] User support email: gowthampoongan@gmail.com
- [ ] Developer contact: gowthampoongan@gmail.com
- [ ] Status: "Testing" (not "Not Published")

**Scopes configured:**

- [ ] openid
- [ ] .../auth/userinfo.email
- [ ] .../auth/userinfo.profile

**Test users added:**

- [ ] kidslaughing200@gmail.com
- [ ] gowthampoongan@gmail.com

**Credentials page (APIs → Credentials):**

- [ ] OAuth Client ID exists: 463755159994-...
- [ ] Redirect URIs include: `https://auth.expo.io/@anonymous/exoptus`

---

## 🔄 After Completing Setup

### 1. Wait 5-10 minutes

Google needs time to propagate changes

### 2. Clear Expo cache

```powershell
# Stop Expo (Ctrl+C)
npx expo start --clear
```

### 3. Test sign-in

- Open app in Expo Go
- Click "Continue with Google"
- **Should now show account chooser**
- Select either email
- Should work! ✅

---

## 🐛 Still Not Working?

### Check Error Details:

When you get the error in browser, look at the URL - it will show:

```
error=invalid_request&error_description=...
```

**Common causes:**

**A) "Missing required parameter: scope"**

- Fix: Scopes not configured in consent screen
- Solution: Go back to step 3, add the 3 scopes

**B) "redirect_uri_mismatch"**

- Fix: Wrong redirect URI
- Solution: Verify `https://auth.expo.io/@anonymous/exoptus` is in credentials

**C) "access_denied"**

- Fix: Email not in test users
- Solution: Add your email to test users (step 4)

**D) "invalid_client"**

- Fix: Client ID mismatch
- Solution: Verify Client ID in code matches console

---

## 📸 Screenshots to Verify

Take screenshots of these pages and verify they match:

### OAuth Consent Screen - App Info:

```
App name: Exoptus
User support email: gowthampoongan@gmail.com
Developer contact: gowthampoongan@gmail.com
```

### OAuth Consent Screen - Scopes:

```
✓ openid
✓ .../auth/userinfo.email
✓ .../auth/userinfo.profile
```

### OAuth Consent Screen - Test Users:

```
✓ kidslaughing200@gmail.com
✓ gowthampoongan@gmail.com
```

---

## ✨ What I Fixed in Code

Updated [welcome.tsx](<app/(auth)/welcome.tsx>):

- ✅ Added required `scopes: ["openid", "profile", "email"]`
- ✅ Added `prompt: "select_account"` to show account chooser
- ✅ Better error handling

---

## 🎯 MOST LIKELY ISSUE

The **Scopes** are probably not configured on the OAuth consent screen.

**Quick fix:**

1. Go to OAuth consent screen
2. Click "EDIT APP"
3. Click "SAVE AND CONTINUE" on App information
4. On Scopes page → "ADD OR REMOVE SCOPES"
5. Select the 3 scopes (openid, email, profile)
6. Click UPDATE, then SAVE AND CONTINUE
7. Continue through Test users → SAVE
8. Back to dashboard → verify Status = "Testing"

**Then wait 5 minutes and test!**
