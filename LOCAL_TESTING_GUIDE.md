# 🔬 EXOPTUS Local Testing & Verification Guide

## Overview

This guide enables you to **verify the app works correctly** even when the backend is not deployed yet.

**Key Principle**: Test in layers — UI → State → API → Backend

---

## 🚦 Quick Start: Enable Local Testing Mode

### Step 1: Set Environment Variable

Create or edit `.env` in project root:

```bash
EXPO_PUBLIC_APP_MODE="local"
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

### Step 2: Restart Expo

```powershell
npm start
# Press 'a' for Android or 'i' for iOS
```

### Step 3: Verify Local Mode is Active

You should see in console:

```
🧪 [LOCAL MODE] Mock responses enabled
   Set EXPO_PUBLIC_APP_MODE='production' to disable
```

---

## 📊 Layer-by-Layer Verification

### ✅ Layer 1: UI & Navigation (No Backend Required)

**Goal**: Prove screens render without crashes

**What to Test**:

- [ ] App launches without crash
- [ ] Welcome screen displays
- [ ] Can navigate to signup/email screens
- [ ] Onboarding chat screen renders
- [ ] Main tabs (Home, Explore, Odyssey, Roadmap, Profile) accessible
- [ ] No missing imports or component errors

**Expected Behavior**:

- ✅ All screens load
- ✅ Mock data appears (e.g., "Test User" in posts)
- ✅ Loading spinners work
- ⚠️ You'll see: "Backend unavailable (local mode)" for unmocked endpoints

**How to Debug**:
| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| App crashes on launch | Import error or syntax issue | Check console logs, fix imports |
| Screen shows blank | Component not exported | Check component `index.ts` exports |
| Navigation error | Route mismatch | Check `expo-router` file structure |

---

### ✅ Layer 2: State & Persistence (Partial Backend)

**Goal**: Prove Zustand stores and AsyncStorage work correctly

**What to Test**:

- [ ] Kill app → Reopen → Onboarding state persists
- [ ] Dashboard data appears after loading
- [ ] Explore screen shows mock posts
- [ ] Pull-to-refresh works
- [ ] Error banners appear/dismiss correctly
- [ ] Loading states toggle properly

**Test Script**:

1. Open app, navigate to onboarding chat
2. Answer one question
3. **Force close app** (swipe away)
4. Reopen app
5. ✅ **Verify**: Previous answer is still there

**Expected Behavior**:

- ✅ Messages persist across restarts
- ✅ Dashboard fetches on mount
- ✅ Loading → Success → Data flow works
- ✅ Pull-to-refresh triggers re-fetch

**How to Debug**:
| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| State resets on restart | Store not persisting | Check `persist()` middleware in store |
| Loading never stops | Fetch didn't resolve | Add timeout, check promise handling |
| Data doesn't update | Fetch not called | Verify `useEffect(() => { fetch() }, [])` |

---

### ✅ Layer 3: API Layer (Mock Mode)

**Goal**: Prove API client correctly wires to backend

**What to Test**:

- [ ] API calls return mock data in local mode
- [ ] Network delay simulation works (300ms)
- [ ] Error handling shows proper messages
- [ ] Console logs show `🧪 [LOCAL MODE] Mock response for <endpoint>`

**Test Script**:

1. Open React Native debugger console
2. Navigate to Home screen
3. ✅ **Look for**: `🧪 [LOCAL MODE] Mock response for /dashboard`
4. Navigate to Explore
5. ✅ **Look for**: `🧪 [LOCAL MODE] Mock response for /community/posts`

**Expected Behavior**:

```
🧪 [LOCAL MODE] Mock responses enabled
🧪 [LOCAL MODE] Mock response for /dashboard
🧪 [LOCAL MODE] Mock response for /community/posts
```

**How to Debug**:
| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| No console logs | Local mode not enabled | Check `.env` has `EXPO_PUBLIC_APP_MODE="local"` |
| Real network error | Mock not defined | Add endpoint to `getMockResponse()` in `localMode.ts` |
| Data shape mismatch | Mock structure wrong | Update `LOCAL_MOCK_DATA` to match backend schema |

---

### ✅ Layer 4: Backend APIs (Local Server)

**Goal**: Verify backend returns correct responses

#### Start Local Server

```powershell
cd server
npm install
npm run dev
```

Expected output:

```
Server running on http://localhost:3000
Database connected
```

#### Test APIs with cURL

**Health Check**:

```bash
curl http://localhost:3000/health
```

Expected: `{"status": "ok"}`

**Onboarding Flow**:

```bash
curl http://localhost:3000/onboarding/flow
```

Expected: JSON with `steps` array

**Dashboard**:

```bash
curl http://localhost:3000/dashboard
```

Expected: JSON with `jrScore`, `profileSteps`, etc.

**Community Posts**:

```bash
curl http://localhost:3000/community/posts
```

Expected: JSON with `posts` array

**Notifications**:

```bash
curl http://localhost:3000/dashboard/notifications
```

Expected: JSON with `notifications` array

#### Backend Verification Checklist

- [ ] Server starts without errors
- [ ] `/health` returns 200 OK
- [ ] `/onboarding/flow` returns flow structure
- [ ] `/dashboard` returns dashboard data
- [ ] `/community/posts` returns posts
- [ ] `/dashboard/notifications` returns notifications
- [ ] All endpoints return valid JSON

**Troubleshooting Backend**:

| Error                       | Cause                | Fix                                   |
| --------------------------- | -------------------- | ------------------------------------- |
| `ECONNREFUSED`              | Server not running   | Run `npm run dev` in `/server`        |
| `500 Internal Server Error` | Backend logic issue  | Check server console logs             |
| `404 Not Found`             | Route not registered | Verify route in `server/src/index.ts` |
| `Prisma Error`              | Database issue       | Run `npx prisma migrate dev`          |

---

## 🔄 Reconnect App to Local Backend

Once backend is running locally:

### Option A: Keep Local Mode (Backend Override)

Backend will respond, but app still uses mocks for missing endpoints.

### Option B: Switch to Production Mode

**Edit `.env`**:

```bash
EXPO_PUBLIC_APP_MODE="production"
EXPO_PUBLIC_API_URL="http://192.168.1.100:3000"  # Your computer's IP
```

**Restart Expo**:

```powershell
npm start
```

Now app hits real backend.

---

## 📱 Testing on Physical Device

If testing on phone (not emulator):

1. Find your computer's local IP:

   ```powershell
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   ```

2. Update `.env`:

   ```bash
   EXPO_PUBLIC_API_URL="http://192.168.1.100:3000"
   ```

3. Ensure phone and computer on same WiFi

4. Restart Expo

---

## 🧹 Cleanup: Remove Local Mode for Production

### Step 1: Update `.env`

```bash
EXPO_PUBLIC_APP_MODE="production"
EXPO_PUBLIC_API_URL="https://api.exoptus.com"  # Your deployed backend
```

### Step 2: (Optional) Remove Mock Files

Once backend is live, you can safely remove:

- `services/localMode.ts`
- Local mode logic from `services/api.ts`

### Step 3: Verify Production

```powershell
npm start
# Should NOT see: "🧪 [LOCAL MODE]" in console
```

---

## 🎯 Decision Matrix: What to Test When

| Stage               | Local Mode  | Backend            | Test Focus                                  |
| ------------------- | ----------- | ------------------ | ------------------------------------------- |
| **UI Development**  | ✅ Enabled  | ❌ Not running     | Screen renders, navigation, layout          |
| **State Logic**     | ✅ Enabled  | ❌ Not running     | Persistence, loading states, error handling |
| **API Integration** | ✅ Enabled  | ✅ Running locally | Request/response flow, data shape           |
| **End-to-End**      | ❌ Disabled | ✅ Running locally | Full flow with real data                    |
| **Production**      | ❌ Disabled | ✅ Deployed        | Live app behavior                           |

---

## 🔍 Verification Checklist (Complete Flow)

### Phase 1: UI Only (No Backend)

- [x] Local mode enabled in `.env`
- [ ] App launches
- [ ] All screens render
- [ ] Navigation works
- [ ] No console errors
- [ ] Mock data appears

### Phase 2: State & Persistence

- [ ] Kill app → Reopen → State persists
- [ ] Loading states work
- [ ] Error banners appear
- [ ] Pull-to-refresh works
- [ ] Console shows `🧪 [LOCAL MODE]` logs

### Phase 3: Backend Local Testing

- [ ] Server starts with `npm run dev`
- [ ] `/health` returns 200
- [ ] All endpoints return valid JSON
- [ ] cURL tests pass

### Phase 4: Full Integration

- [ ] Switch to production mode
- [ ] Update API_URL to local IP
- [ ] App fetches from backend
- [ ] No "Backend unavailable" errors
- [ ] Real data displays

### Phase 5: Production Readiness

- [ ] Backend deployed
- [ ] `.env` has production URL
- [ ] Local mode disabled
- [ ] End-to-end flow works
- [ ] No mock data

---

## 🚨 Common Issues & Solutions

### Issue: "Network error. Please check your connection"

**Cause**: Local mode disabled, backend not running

**Fix**:

```bash
# Option 1: Enable local mode
EXPO_PUBLIC_APP_MODE="local"

# Option 2: Start backend
cd server && npm run dev
```

---

### Issue: "Backend unavailable (local mode). Add mock for /endpoint"

**Cause**: Endpoint not mocked

**Fix**: Add to `services/localMode.ts`:

```typescript
if (endpoint.includes("/your-endpoint")) {
  return { your: "data" };
}
```

---

### Issue: State resets on app restart

**Cause**: Store not persisting

**Fix**: Check `store/*Store.ts` has:

```typescript
persist(
  (set, get) => ({
    /* state */
  }),
  { name: "store-name" }
);
```

---

## 📊 Success Criteria

You'll know everything works when:

✅ App launches without crash  
✅ Local mode shows mock data  
✅ State persists after restart  
✅ Backend APIs return 200 OK  
✅ App works with backend connected  
✅ Production mode uses real data

---

## 🎓 Key Takeaways

1. **Local mode is NOT production code** — it's a testing tool
2. **Always test in layers** — don't jump to backend first
3. **Mock data should match backend schema** — prevents integration surprises
4. **Feature flags are reversible** — no permanent changes
5. **Production safety** — local mode has zero impact when disabled

---

## 🔗 Related Files

- [.env](.env) — Environment configuration
- [services/localMode.ts](services/localMode.ts) — Mock data & utilities
- [services/api.ts](services/api.ts) — API client with local mode support
- [server/src/index.ts](server/src/index.ts) — Backend routes

---

**Last Updated**: Phase 2 Complete (January 2026)
