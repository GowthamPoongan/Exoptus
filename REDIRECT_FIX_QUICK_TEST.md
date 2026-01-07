# 🎯 Quick Test: Email Verification Redirect

## What was fixed

✅ **Redirect now opens YOUR current Expo dev instance** (not a random/cached one)

## How to test it

### Step 1: Start both servers

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Expo (from project root)
npx expo start --port 8082
```

### Step 2: Test the flow

1. Open Expo Go on device/emulator and scan QR code
2. In app, go to **Sign Up → Enter Email**
3. Enter your email
4. Check that email for verification link (from Exoptus service)
5. **Click the link** in the email
6. **You should see**:
   - "✓ Email Verified!" success page
   - Button: "Open Exoptus App"
   - After ~300ms: Auto-redirects to YOUR Expo instance
   - **App shows**: Verifying screen with your email data

### What happens if custom scheme fails

- If `exoptus://` redirect doesn't work after 1.5 seconds
- Falls back to Expo Go launcher URL
- You can also click the "Open Exoptus App" button manually

## Debug checklist

- [ ] Backend is running (`npm run dev` in /server)
- [ ] Expo is running (`npx expo start`)
- [ ] Email is being sent (check backend logs for "Sending verification email")
- [ ] Deep link URL is correct (check browser console on verification page)
- [ ] App receives deep link (look for "🔗 Deep link received:" in Expo logs)
- [ ] Correct data in verifying screen

## Key changes made

1. ✅ Backend now uses `exoptus://` scheme (not hardcoded IP)
2. ✅ Fallback to Expo Go if custom scheme fails
3. ✅ Enhanced deep link parsing in app
4. ✅ Better logging for debugging
