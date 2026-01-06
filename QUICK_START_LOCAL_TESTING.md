# 🚦 QUICK START: Test App Without Backend

## 1️⃣ Enable Local Mode (5 seconds)

Check `.env` file has:

```bash
EXPO_PUBLIC_APP_MODE="local"
```

## 2️⃣ Start App

```powershell
npm start
```

## 3️⃣ Verify Console Shows

```
🧪 [LOCAL MODE] Mock responses enabled
```

**✅ Done! App now works without backend.**

---

## 🧪 What You Can Test

| Test                 | Works? | Why                                |
| -------------------- | ------ | ---------------------------------- |
| Navigate all screens | ✅     | UI independent of backend          |
| See dashboard data   | ✅     | Mock data from `localMode.ts`      |
| See community posts  | ✅     | Mock posts provided                |
| Kill app → Reopen    | ✅     | Store persistence via AsyncStorage |
| Pull to refresh      | ✅     | Triggers mock API calls            |
| Error states         | ✅     | Simulated for unmocked endpoints   |

---

## 🔧 When to Start Backend

Start backend when:

- UI tests pass ✅
- State persistence works ✅
- Ready to test real API integration

```powershell
cd server
npm run dev

# In new terminal:
.\verify-backend.ps1
```

**Expected**: All tests pass ✅

---

## 🔄 Connect to Backend

Edit `.env`:

```bash
EXPO_PUBLIC_APP_MODE="production"
EXPO_PUBLIC_API_URL="http://192.168.1.100:3000"  # Your IP
```

Restart:

```powershell
npm start
```

---

## 🎯 Layer-by-Layer Testing

```
Layer 1: UI → Just launch app (local mode)
Layer 2: State → Kill/reopen, check persistence (local mode)
Layer 3: API → Check console logs (local mode)
Layer 4: Backend → Run verify-backend.ps1 (server running)
Layer 5: Integration → Switch to production mode (full flow)
```

---

## 📊 Decision Matrix

| Symptom                 | Fault                | Fix                                |
| ----------------------- | -------------------- | ---------------------------------- |
| App crashes on launch   | UI/imports           | Check console logs                 |
| "Network error"         | Local mode off       | Set `EXPO_PUBLIC_APP_MODE="local"` |
| State resets on restart | Store not persisting | Check `persist()` in store         |
| Backend tests fail      | Server not running   | Run `npm run dev`                  |

---

## 🔗 Full Docs

- [LOCAL_TESTING_GUIDE.md](LOCAL_TESTING_GUIDE.md) — Complete guide
- [PHASE_2_LOCAL_TESTING_COMPLETE.md](PHASE_2_LOCAL_TESTING_COMPLETE.md) — Implementation summary
- [verify-backend.ps1](verify-backend.ps1) — Backend test script

---

**TL;DR**: Set `EXPO_PUBLIC_APP_MODE="local"` → Run app → Test UI/state → Start backend → Switch to production mode → Done.
