# PHASE 6: REFACTOR PLAN (STRICTLY NON-DESTRUCTIVE)

## Step-by-Step MVP Stabilization Roadmap

**Date**: January 3, 2026  
**Approach**: Small, testable, reversible changes  
**Total Time**: 40-60 hours (1-2 weeks with one engineer)  
**Risk Level**: Very Low (each step is isolated and reversible)

---

## EXECUTIVE: Impact vs. Effort Matrix

```
High Impact
    │
    ├─  S4: Wire Dashboard API (High/Medium)  ⭐⭐⭐
    ├─  S5: Persist Onboarding (High/Medium)  ⭐⭐⭐
    ├─  S3: Integration Foundation (High/Low)  ⭐⭐⭐⭐
    │
    ├─  S1: Fix TypingIndicator (Medium/Low)  ⭐⭐⭐⭐
    ├─  S2: Fix EvalProgress (Medium/Low)     ⭐⭐⭐⭐
    ├─  S6: Wire Explore API (Medium/Medium)  ⭐⭐⭐
    │
    ├─  S7: Compress Videos (Low/Low)         ⭐⭐⭐⭐
    ├─  S8: Delete Duplicates (Low/Low)       ⭐⭐⭐⭐
    │
Low Impact
    └─────────────────────────────────────
    Easy                              Hard
        Effort to Implement
```

---

## RECOMMENDED EXECUTION ORDER

**Strategy**: Do quick wins first (builds momentum), then tackle backbone integration

### Week 1 (Days 1-5)

- **Day 1**: S1, S2 (Performance: 20 min total)
- **Day 2**: S7, S8 (Cleanup: 45 min total)
- **Day 3**: S3 (Foundation: 4 hours)
- **Day 4**: S5 (Onboarding: 4 hours)
- **Day 5**: S3 + S5 integration testing (2 hours)

### Week 2 (Days 6-10)

- **Day 6**: S4 (Dashboard: 3 hours)
- **Day 7**: S6 (Explore: 2 hours)
- **Day 8-9**: Testing, edge cases, error handling
- **Day 10**: Deploy MVP

---

## STEP 1: Fix TypingIndicator Animation (QUICK WIN)

**Impact**: Medium (UI feels smoother)  
**Effort**: Low (5 minutes)  
**Risk**: Very Low (isolated change)  
**Reversibility**: 100% (just revert the function)

### Objective

Move typing animation from JS timer to Reanimated native thread, eliminating scroll jank.

### Files Affected

- `app/(onboarding)/chat.tsx` (Lines 470-520)

### Changes Required

**Before** (Lines 470-510):

```typescript
const TypingIndicator = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      dot1.value = withSequence(
        withTiming(-5, { duration: 400 }),
        withTiming(0, { duration: 400 })
      );
      setTimeout(() => {
        dot2.value = withSequence(...);
      }, 200);
      setTimeout(() => {
        dot3.value = withSequence(...);
      }, 400);
    };

    animate();
    const interval = setInterval(animate, 1200);  // ← Problem
    return () => clearInterval(interval);
  }, []);
```

**After** (Lines 470-515):

```typescript
const TypingIndicator = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // All on native thread
    dot1.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      false
    );

    dot2.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      )
    );

    dot3.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      )
    );

    return () => {};  // No cleanup needed
  }, []);
```

### Testing Procedure

1. Open app, navigate to onboarding chat
2. Scroll while messages are typing
3. **Pass**: Scroll is smooth (60 FPS), typing animation is visible
4. **Fail**: Any jank during scroll or animation missing

### Rollback Procedure

```bash
git checkout app/(onboarding)/chat.tsx
```

### Time Estimate

- Code: 5 minutes
- Testing: 5 minutes
- **Total: 10 minutes**

### Dependencies

- None (isolated component)

---

## STEP 2: Fix EvalProgress Multiple Intervals (QUICK WIN)

**Impact**: Medium (prevents re-render storms)  
**Effort**: Low (15 minutes)  
**Risk**: Low (isolated effect)  
**Reversibility**: 100%

### Objective

Replace `setInterval` + 5 setState calls with async loop + single setState, reducing 1,110 re-renders to ~100.

### Files Affected

- `app/(onboarding)/evaluation-progress.tsx` (Lines 56-140)

### Changes Required

Replace the entire `useEffect` hook (roughly 80 lines):

**Key changes**:

1. Remove `setInterval(..., 45)`
2. Replace with async loop using `await new Promise(...)`
3. Combine 5 `setCompletedItems` calls into one
4. Move glow animation to `withRepeat` (native thread)
5. Add `cancelled` flag for cleanup

### Testing Procedure

1. Complete onboarding flow (reach evaluation progress)
2. Watch progress bar animate
3. **Pass**: No console errors, navigation works after completion
4. **Fail**: Memory spike, missed animations, or stuck at 100%

**Advanced test**:

```typescript
// Add to component
useEffect(() => {
  console.log("EvalProgress rendered");
}, [percentage]); // Track renders
```

Expect ~30 logs (not 200+)

### Rollback Procedure

```bash
git checkout app/(onboarding)/evaluation-progress.tsx
```

### Time Estimate

- Code: 15 minutes
- Testing: 10 minutes
- **Total: 25 minutes**

### Dependencies

- None (isolated screen)

---

## STEP 3: Create API Integration Foundation (BACKBONE)

**Impact**: High (enables all future API calls)  
**Effort**: Medium (4 hours)  
**Risk**: Low (non-breaking changes)  
**Reversibility**: High (just adds code, doesn't break existing)

### Objective

Set up infrastructure for backend API calls: error handling, loading states, type safety, retry logic.

### Files Affected

- `services/api.ts` (enhance existing)
- Create: `services/apiHooks.ts` (new)
- Create: `types/api.ts` (new types)

### Changes Required

#### 1. Enhance `services/api.ts`

Add error retry and timeout:

```typescript
// Add to class
private async requestWithRetry<T>(
  endpoint: string,
  config: RequestConfig = {},
  maxRetries: number = 2
): Promise<ApiResponse<T>> {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await this.request<T>(endpoint, config);
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * Math.pow(2, i))  // Exponential backoff
        );
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Request failed after retries'
  };
}
```

#### 2. Create `services/apiHooks.ts` (new file)

Custom hooks for common API patterns:

```typescript
import { useState, useCallback } from "react";
import api from "./api";

export const useApi = <T>(endpoint: string, method: "GET" | "POST" = "GET") => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (body?: any) => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.request<T>(endpoint, {
          method,
          body,
        });

        if (result.success) {
          setData(result.data || null);
        } else {
          setError(result.error || "Unknown error");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, method]
  );

  return { data, loading, error, fetch };
};
```

#### 3. Create `types/api.ts` (new file)

```typescript
export interface ApiDashboard {
  jrScore: number;
  jrScoreHistory: Array<{ date: string; score: number }>;
  tasks: Array<{ id: string; title: string; completed: boolean }>;
  notifications: Array<{ id: string; title: string; read: boolean }>;
  profileCompletion: number;
}

export interface ApiOnboardingSubmit {
  userId: string;
  answers: any[];
  userData: any;
}

export interface ApiCareerAnalysis {
  jrScore: number;
  skills: Array<{ name: string; userLevel: number; industryAvg: number }>;
  recommendations: string[];
  readinessTimeline: string;
}
```

### Testing Procedure

1. Create simple test screen that calls new hooks
2. Verify loading/error states work
3. Verify retry logic works (simulate network failure)

### Rollback Procedure

```bash
git checkout services/api.ts
git rm services/apiHooks.ts
git rm types/api.ts
```

### Time Estimate

- Enhance API: 1 hour
- Create hooks: 1.5 hours
- Create types: 0.5 hours
- Testing: 1 hour
- **Total: 4 hours**

### Dependencies

- None (foundation layer)

### Risk Assessment

- **Very Low**: Only adds code, doesn't change existing behavior

---

## STEP 4: Persist Onboarding Data to Backend (CORE FEATURE)

**Impact**: High (fixes data loss, enables personalization)  
**Effort**: Medium (4 hours)  
**Risk**: Medium (integrates with backend)  
**Reversibility**: High (just adds API calls)

### Objective

Save user's onboarding answers and conversation history to backend instead of losing them.

### Files Affected

- `app/(onboarding)/chat.tsx` (Lines 823-850: add API call)
- `services/auth.ts` (no changes, backend ready)
- `server/src/routes/onboarding.ts` (already has endpoint at line 28)

### Changes Required

#### 1. In `chat.tsx`, modify `processStep` function

Add API call when onboarding completes:

```typescript
// Current code (lines 823-850)
const processStep = useCallback(
  async (stepId: string) => {
    const step = CONVERSATION_FLOW[stepId];
    if (!step || stepId === "done") {
      completeOnboarding();

      // EXISTING CODE: Generate fake analysis
      const analysisData = { ... };
      setCareerAnalysis(analysisData);

      // ADD THIS: Submit to backend
      try {
        const response = await api.request<ApiCareerAnalysis>(
          '/onboarding/submit',
          {
            method: 'POST',
            body: {
              userId: useUserStore.getState().user?.id,
              answers: useOnboardingStore.getState().answers,
              userData: userData
            }
          }
        );

        if (response.success && response.data) {
          // Use backend analysis instead of fake
          setCareerAnalysis(response.data);
        }
      } catch (error) {
        console.error('Onboarding submit failed:', error);
        // Fall back to fake analysis (still have something)
      }

      setTimeout(() => {
        router.push("/(onboarding)/evaluation-progress" as any);
      }, 1500);
      return;
    }

    // ... rest of function unchanged
  },
  [addSystemMessages, userData, completeOnboarding]
);
```

#### 2. In `chat.tsx`, track conversation persistence

Add optional call to save messages (backend not ready yet, so skip for now):

```typescript
// Future: when backend ready
// POST /onboarding/chat/message endpoint
// This is already planned in backend roadmap
```

### Testing Procedure

1. Complete onboarding flow
2. Verify API call in network inspector
3. **Pass**: Network tab shows POST to `/onboarding/submit`
4. **Pass**: Onboarding data stored in database (check backend logs)
5. **Fail**: API fails gracefully (falls back to fake analysis)

**Advanced test**:

```typescript
// In browser DevTools, mock API failure
// Verify app still completes (fallback works)
```

### Rollback Procedure

```bash
git checkout app/(onboarding)/chat.tsx
```

### Time Estimate

- Identify where to call: 30 minutes
- Write API call: 30 minutes
- Add error handling: 30 minutes
- Testing: 1.5 hours
- **Total: 3 hours**

### Dependencies

- **Must complete first**: Step 3 (API foundation)
- **Backend assumption**: POST /onboarding/submit endpoint exists

### Backend Dependency

```typescript
// server/src/routes/onboarding.ts line 28 already has this:
router.post("/submit", async (req, res) => {
  const { userId, answers, userData } = req.body;

  const profile = await db.onboardingProfile.create({
    data: {
      userId,
      answers,
      userData,
    },
  });

  const analysis = await generateCareerAnalysis(userId, userData);
  return res.json(analysis);
});
```

---

## STEP 5: Wire Dashboard to Real Data (HIGH IMPACT)

**Impact**: High (replaces all hardcoded content)  
**Effort**: Medium (3-4 hours)  
**Risk**: Medium (replaces default data)  
**Reversibility**: Medium (easy to switch back, but affects UX)

### Objective

Replace hardcoded dashboard data with real API calls to backend.

### Files Affected

- `app/(main)/home.tsx` (Lines 220-350: add data fetch)
- Create: `services/dashboardService.ts` (optional, but good practice)
- `store/dashboardStore.ts` (no changes, reuse existing)

### Changes Required

#### Option A: Simple (No new file)

Add useEffect to `home.tsx`:

```typescript
// Add to HomeScreen component, after hooks
useEffect(() => {
  const fetchDashboard = async () => {
    try {
      const response = await api.request<ApiDashboard>("/user/dashboard");

      if (response.success && response.data) {
        useDashboardStore.setState({
          jrScore: response.data.jrScore,
          jrScoreHistory: response.data.jrScoreHistory,
          tasks: response.data.tasks,
          notifications: response.data.notifications,
        });
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    }
  };

  fetchDashboard();
}, []); // Run once on mount
```

#### Option B: Clean (Recommended)

Create `services/dashboardService.ts`:

```typescript
import api from "./api";
import { ApiDashboard } from "../types/api";

export const dashboardService = {
  async fetchDashboard(): Promise<ApiDashboard | null> {
    const response = await api.request<ApiDashboard>("/user/dashboard");
    return response.success ? response.data || null : null;
  },

  async updateTask(taskId: string, completed: boolean) {
    return api.request(`/user/tasks/${taskId}`, {
      method: "PATCH",
      body: { completed },
    });
  },

  async createTask(title: string, date: string) {
    return api.request("/user/tasks", {
      method: "POST",
      body: { title, date },
    });
  },
};
```

Then in `home.tsx`:

```typescript
useEffect(() => {
  const fetchData = async () => {
    const data = await dashboardService.fetchDashboard();
    if (data) {
      useDashboardStore.setState({
        jrScore: data.jrScore,
        jrScoreHistory: data.jrScoreHistory,
        tasks: data.tasks,
        notifications: data.notifications,
      });
    }
  };

  fetchData();
}, []);
```

### Backend Endpoint Required

**Status**: Doesn't exist yet (need to create)

Create in `server/src/routes/user.ts`:

```typescript
router.get("/dashboard", auth, async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.userId },
    include: {
      tasks: true,
      careerAnalysis: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const jrScore = user.careerAnalysis?.jrScore || 0;

  return res.json({
    jrScore,
    jrScoreHistory: [
      /* fetch from database */
    ],
    tasks: user.tasks || [],
    notifications: [
      /* fetch from database */
    ],
    profileCompletion: calculateCompletion(user),
  });
});
```

### Testing Procedure

1. Complete onboarding (creates JR score)
2. Navigate to home screen
3. **Pass**: Network shows GET /user/dashboard
4. **Pass**: Dashboard displays real JR score (not 78)
5. **Pass**: Refresh updates data
6. **Fail gracefully**: If API fails, show default data with error message

### Rollback Procedure

```bash
git checkout app/(main)/home.tsx
git rm services/dashboardService.ts  # if created
```

### Time Estimate

- API call setup: 30 minutes
- Handle loading states: 30 minutes
- Error handling: 30 minutes
- Testing: 1.5 hours
- **Total: 3-4 hours**

### Dependencies

- **Must complete first**: Step 3 (API foundation)
- **Backend work**: Create GET /user/dashboard endpoint (0.5-1 hour backend work)

### Risk Assessment

- **Medium**: Replaces default data, but gracefully falls back
- **Mitigation**: Keep default data as fallback

---

## STEP 6: Wire Explore Screen to Community API (FEATURE)

**Impact**: Medium (enables real content)  
**Effort**: Low-Medium (2 hours)  
**Risk**: Low (isolated screen)  
**Reversibility**: High

### Objective

Replace hardcoded `MOCK_POSTS` with real API calls.

### Files Affected

- `app/(main)/explore.tsx` (Lines 50-150: replace mock data)

### Changes Required

#### 1. Remove mock data

```diff
- const MOCK_POSTS = [
-   { id: "1", author: {...}, title: "From Student to Developer", ... },
-   // ... 4 more hardcoded posts
- ];
```

#### 2. Add API call

```typescript
// Add to ExploreScreen component
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await api.request<any[]>("/community/posts");
      if (response.success) {
        setPosts(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
      setPosts([]); // Empty, not error state (for MVP)
    } finally {
      setLoading(false);
    }
  };

  fetchPosts();
}, []);

// Replace render from MOCK_POSTS to posts
{
  posts.map((post) => <PostCard key={post.id} post={post} />);
}
```

### Backend Endpoint Required

**Status**: Doesn't exist yet (need to create)

Create in `server/src/routes/community.ts` (new file):

```typescript
import { Router } from "express";

const router = Router();

router.get("/posts", async (req, res) => {
  // For MVP: return empty array or sample data
  // Later: fetch from database
  return res.json([
    // Eventually: real posts from community table
  ]);
});

export default router;
```

### Testing Procedure

1. Navigate to Explore tab
2. **Pass**: Network shows GET /community/posts (even if empty)
3. **Fail gracefully**: If API fails, show empty state with message

### Rollback Procedure

```bash
git checkout app/(main)/explore.tsx
```

### Time Estimate

- Remove mock: 15 minutes
- API integration: 30 minutes
- Error handling: 15 minutes
- Testing: 1 hour
- **Total: 2 hours**

### Dependencies

- **Must complete first**: Step 3 (API foundation)
- **Backend work**: Create GET /community/posts endpoint (optional for MVP, can return empty)

---

## STEP 7: Compress Video Assets (QUICK WIN)

**Impact**: Low-Medium (app size reduction)  
**Effort**: Low (20 minutes)  
**Risk**: Very Low (build step, no code changes)  
**Reversibility**: 100% (just delete compressed versions)

### Objective

Reduce 4 video files from 15-20MB to 6-8MB using ffmpeg compression.

### Files Affected

- `assets/videos/carousel_clip_1.mp4`
- `assets/videos/carousel_clip_2.mp4`
- `assets/videos/carousel_clip_3.mp4`
- `assets/videos/logo_reveal.mp4`

### Changes Required

#### 1. Install ffmpeg (if not already)

```bash
# Windows (with Chocolatey)
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

#### 2. Compress each video

```bash
# Reduce bitrate from ~5Mbps to 2.5Mbps, keep 1280×720 resolution
cd assets/videos

ffmpeg -i carousel_clip_1.mp4 -b:v 2500k -b:a 128k carousel_clip_1.mp4
ffmpeg -i carousel_clip_2.mp4 -b:v 2500k -b:a 128k carousel_clip_2.mp4
ffmpeg -i carousel_clip_3.mp4 -b:v 2500k -b:a 128k carousel_clip_3.mp4
ffmpeg -i logo_reveal.mp4 -b:v 2500k -b:a 128k logo_reveal.mp4
```

**Result**: ~50-60% size reduction per video

### Testing Procedure

1. Run `eas build --platform android` or similar
2. **Pass**: App size reduced by 8-10MB
3. **Pass**: Videos still play smoothly
4. **Pass**: No visible quality loss on mobile

### Rollback Procedure

```bash
git checkout assets/videos/
```

### Time Estimate

- Download ffmpeg: 5 minutes
- Compress 4 videos: 10 minutes
- Verify: 5 minutes
- **Total: 20 minutes**

### Dependencies

- None

---

## STEP 8: Delete Duplicate Codebase (CLEANUP)

**Impact**: Low (code cleanliness)  
**Effort**: Low (30 minutes)  
**Risk**: Very Low (deletion only, no modification)  
**Reversibility**: 100% (keep git history)

### Objective

Remove 100% duplicate code in `/apps/mobile/app/` and consolidate `/services/auth-service/` into `/server/`.

### Files Affected (TO DELETE)

- `/apps/mobile/app/` (entire directory, ~500KB)
- `/apps/mobile/node_modules/` (if exists, rebuild from `/server/`)

### Changes Required

#### Option A: Conservative (Safest)

Keep duplicates but mark as deprecated:

```bash
# In /apps/mobile/app/_layout.tsx, add comment
/*
 * @deprecated - Use /app/ instead
 * This directory is a duplicate and will be removed in v1.1.0
 */
```

#### Option B: Aggressive (Recommended)

Delete duplicates:

```bash
# Step 1: Verify /app/ is the source
# Step 2: Delete /apps/mobile/app/
rm -r /apps/mobile/app/
# Step 3: Update /apps/mobile/package.json to remove reference
```

#### Option C: Smart (Future-proof)

Create symlink (on Unix-like systems):

```bash
# On Windows, use mklink
mklink /D "apps/mobile/app" "../../app"
```

### Testing Procedure

1. Verify `/app/` is still the active directory
2. Run `npm install` and `npm start`
3. **Pass**: App boots normally
4. **Pass**: No "duplicate module" warnings

### Rollback Procedure

```bash
git checkout .
# Restores /apps/mobile/app/
```

### Time Estimate

- Verify duplication: 10 minutes
- Decide approach: 5 minutes
- Delete: 5 minutes
- Test: 10 minutes
- **Total: 30 minutes**

### Dependencies

- None (cleanup only)

### Risk Assessment

- **Very Low**: Only deletion, git history preserved

---

## OPTIONAL ENHANCEMENTS (Not Critical for MVP)

### S9: Add Error Boundaries (Polish)

**Impact**: Medium (better error UX)  
**Effort**: Low (1-2 hours)  
**When**: After Step 5

### S10: Implement Retry Logic (Polish)

**Impact**: Low (better network resilience)  
**Effort**: Low (1 hour)  
**When**: After Step 3

### S11: Add Loading Skeletons (Polish)

**Impact**: Low (perceived performance)  
**Effort**: Medium (2-3 hours)  
**When**: After Steps 4-6

### S12: Implement Offline Mode (Future)

**Impact**: Medium (works without internet)  
**Effort**: High (6+ hours)  
**When**: Post-MVP

---

## EXECUTION TIMELINE

### Recommended Schedule (1 Engineer)

```
WEEK 1
├─ Monday
│  ├─ 9am-10am: S1 (TypingIndicator fix) - 10 min code + testing
│  ├─ 10am-11am: S2 (EvalProgress fix) - 25 min code + testing
│  ├─ 11am-12pm: S7 (Compress videos) - 20 min
│  └─ 12pm-1pm: S8 (Delete duplicates) - 30 min
│
├─ Tuesday-Thursday
│  └─ S3 (API Foundation) - 4 hours
│
├─ Friday Morning
│  └─ S3 Testing & S5 Prep - 2 hours
│
└─ Friday Afternoon
   └─ S5 (Persist Onboarding) - 3 hours

WEEK 2
├─ Monday
│  └─ S5 Finalization & Testing - 2 hours
│
├─ Tuesday
│  ├─ Complete S4 (Dashboard API) - 4 hours
│  └─ Verify Step 4 works - 1 hour
│
├─ Wednesday
│  ├─ S6 (Explore API) - 2 hours
│  └─ Full end-to-end testing - 2 hours
│
├─ Thursday
│  └─ Error handling, edge cases - 3 hours
│
└─ Friday
   └─ Deploy MVP 🚀
```

**Total**: ~40-50 hours (realistic for one engineer)

---

## VALIDATION CHECKLIST

After each step, verify:

### S1: TypingIndicator

- [ ] No console errors
- [ ] Animation visible while typing
- [ ] Scroll smooth (60 FPS)
- [ ] Can scroll during animation

### S2: EvalProgress

- [ ] Navigation works after completion
- [ ] Progress bar animates
- [ ] No memory spike
- [ ] <50 re-renders during animation

### S3: API Foundation

- [ ] API service works
- [ ] Error handling functions
- [ ] Retry logic triggers on failure
- [ ] Types compile without errors

### S4: Onboarding Persistence

- [ ] API call made on completion
- [ ] Data appears in database
- [ ] Fallback works if API fails
- [ ] No console errors

### S5: Dashboard Real Data

- [ ] JR Score from API (not hardcoded 78)
- [ ] Refresh updates data
- [ ] Empty state shown if no data
- [ ] Error message if API fails

### S6: Explore Real Data

- [ ] Network call made
- [ ] Empty state shown if no posts
- [ ] Graceful failure if API down

### S7: Videos Compressed

- [ ] Videos still play
- [ ] App size reduced 8-10MB
- [ ] No visual quality loss

### S8: Duplicates Removed

- [ ] App still starts
- [ ] No "duplicate module" warnings
- [ ] File size reduced ~500KB

---

## ROLLBACK PROCEDURES

**If any step fails**:

```bash
# Option 1: Undo specific file
git checkout <filename>

# Option 2: Undo entire step
git reset --hard HEAD~1

# Option 3: Emergency fallback
git stash
git pull origin main
```

**Each step can be reverted independently** - this is why small, testable steps matter.

---

## PERFORMANCE IMPACT

| Step        | Scroll FPS | Load Time | Memory | Bundle Size |
| ----------- | ---------- | --------- | ------ | ----------- |
| Before      | 45-50      | 2-3s      | High   | 120MB       |
| After S1+S2 | 60         | 2-3s      | Normal | 120MB       |
| After S3-S6 | 60         | <2s       | Normal | 120MB       |
| After S7+S8 | 60         | <2s       | Normal | 110MB       |

---

## RISK SUMMARY

| Step | Risk     | Mitigation           |
| ---- | -------- | -------------------- |
| S1   | Very Low | Isolated component   |
| S2   | Low      | Fallback to defaults |
| S3   | Very Low | Only adds code       |
| S4   | Medium   | Fallback to defaults |
| S5   | Medium   | Error handling       |
| S6   | Low      | Empty state          |
| S7   | Very Low | Build step           |
| S8   | Very Low | Git history          |

**Overall Risk**: Very Low (each step is isolated and reversible)

---

## SUCCESS CRITERIA

### After Week 1

- [ ] All performance fixes applied
- [ ] API foundation in place
- [ ] Onboarding data persists
- [ ] Duplicates removed
- [ ] Code compiles, no errors

### After Week 2

- [ ] Dashboard shows real data
- [ ] Explore fetches from API
- [ ] End-to-end flow works
- [ ] Error handling tested
- [ ] Ready to deploy MVP

---

## WHAT'S NOT INCLUDED

These are post-MVP work:

❌ Database seeding (community data)  
❌ Analytics integration  
❌ Advanced error tracking  
❌ Offline mode  
❌ Advanced caching  
❌ God file refactoring (chat.tsx splitting)  
❌ Store consolidation

**Why**: These don't block MVP launch. Do them in next sprint.

---

## SUMMARY

**This refactor plan takes your app from**:

- 70% theater → 95% functional
- 0% backend integration → 80% integrated
- Hardcoded content → Real data-driven
- Janky animations → Smooth 60 FPS

**In**: 1-2 weeks with one engineer  
**With**: Zero architectural changes required  
**And**: 100% ability to rollback each step

**Next step**: Pick Monday morning and start with S1. 💪
