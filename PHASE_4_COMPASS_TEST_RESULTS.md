# PHASE 4: COMPASS TEST RESULTS

## "If I remove all UI beauty, does the app still guide a user correctly?"

**Date**: January 3, 2026  
**Question**: Is there a coherent application core that steers user behavior, or is the app just decorated theater?  
**Methodology**: Traced complete user journey from app launch → auth → onboarding → dashboard, mapping data sources and decision points.

---

## EXECUTIVE SUMMARY

**The verdict: 70% Theater, 30% Core**

The app has a **partial core** consisting of:

- ✅ Authentication flow (with proper backend sync)
- ✅ Route determination logic (data-driven via backend field)

But loses coherence in the **experience layer**:

- ❌ Onboarding conversation never persists to backend
- ❌ Career analysis computed server-side but completely ignored
- ❌ Dashboard hardcoded defaults (not fetched from API)
- ❌ Community content and roadmap content completely fabricated
- ❌ No single source of truth for user progress after auth

**Core problem**: The backend built a **valid data model** but the frontend **never integrated with it**. Backend and frontend act like two separate applications bolted together.

---

## COMPREHENSIVE USER JOURNEY MAP

### Stage 1: Authentication (30% core, 70% theater)

#### Path: Welcome Screen → Email/Google → Verification → Dashboard Entry

**Data Flow**:

```
User Action              What Happens                   Source of Truth
─────────────────────────────────────────────────────────────────────
Sign up with email    → authService.startEmailFlow()  → Backend (API call)
Click magic link      → verifying.tsx parses token    → Backend (JWT)
Token verified        → authService.verifyMagicLink() → Backend (Database)
User object loaded    → useUserStore.setUser()        → AsyncStorage (cached)
Route determined      → getRouteForUser()              → ✅ Backend field (user.onboardingStatus)
```

**Core parts** (data-driven):

- `authService.verifyMagicLink(token)` makes real API call to `/auth/verify`
- Returns user object with `onboardingStatus` field from database
- `verifying.tsx` line 250-270: Route selection uses backend data
  ```tsx
  const route =
    result.user.onboardingStatus === "completed"
      ? "/(main)/home"
      : "/(onboarding)/chat"; // ← Backend drives this decision
  ```
- User progress **IS tracked server-side** correctly
- Frontend respects backend state for routing

**Theater parts** (hardcoded):

- Welcome screen shows both email + Google buttons (either could work)
- No API error recovery; just shows "error occurred"
- No backend validation of email format; UI accepts it
- Google OAuth response handling same as email (no special flow)

**Verdict**: ✅ **REAL** - This flow has a functioning core

### Stage 2: Onboarding (5% core, 95% theater)

#### Path: Intro Carousel → Chat Conversation → Analysis → Complete

**Critical Discovery**: Everything in this stage is **completely frontend-only**. No integration with backend endpoints.

#### Substage 2a: Intro Carousel

**Where**: `app/(onboarding)/intro-carousel.tsx` lines 1-341  
**What happens**: 3 video clips play, pause at 80%, show text overlay, user taps Next

**Data flow**:

```
Video plays     → onPlaybackStatusUpdate() triggered by expo-av
Pause happens   → showOverlayContent() plays animations
User taps Next  → if final slide → router.replace("/(main)/home")
```

**Source of truth**: None. Carousel is hardcoded. No backend call to check if it should be shown.

**Backend integration**: ❌ ZERO

- Could call `GET /onboarding/flow/intro` to fetch video URLs dynamically
- Could track which video user watched via `POST /onboarding/tracking`
- **Actually does**: Neither. Just plays hardcoded require() statements

**Verdict**: 🎭 **100% THEATER** - Cosmetic only

---

#### Substage 2b: Chat Conversation Flow

**Where**: `app/(onboarding)/chat.tsx` lines 1-1779  
**What happens**: Asks ~35 questions in conversational sequence, collects answers, generates fake analysis

**Code locations**:

- CONVERSATION_FLOW config: Lines 90-490 (400 lines, all hardcoded)
- Questions: "ask_name", "ask_status", "ask_gender", "ask_age", ..., "working_upgrade_goal"
- Logic dispatch: Lines 800-1000 (processStep, handleUserResponse)

**Data structure**:

```typescript
// Line 85-490: Entire conversation flow is hardcoded config
const CONVERSATION_FLOW = {
  intro: { messages: [...], inputType: "none", nextStep: "consent" },
  consent: { messages: [...], inputType: "consent", nextStep: "ask_name" },
  ask_name: { messages: [...], inputType: "text", validator: (...) => {...}, nextStep: "ask_status" },
  ask_status: { messages: [...], inputType: "chips", options: ["Student", "Graduate", "Working"], nextStep: (response) => {...} },
  // ... 30+ more steps
  complete: { messages: [...], inputType: "none", nextStep: "done" }
};
```

**Data sources**:

- ❌ Questions hardcoded (cannot be changed without deploy)
- ❌ Question order hardcoded
- ❌ Validation rules hardcoded
- ❌ Role options hardcoded (3 fake roles: line 496-510)
- ✅ User answers stored locally (chat.tsx line 1150)
- ✅ Answers also stored in onboardingStore (line 1150: addAnswer())

**API integration**: ❌ COMPLETELY MISSING

- No `POST /onboarding/flow` to fetch conversation structure
- No `GET /onboarding/roles` to fetch available roles
- No `POST /onboarding/chat/message` to persist conversation
- No `POST /onboarding/submit` to finalize answers

**Backend has these endpoints**:

- ✅ `POST /onboarding/submit` (line 28 in server/src/routes/onboarding.ts)

  - Accepts: { userId, answers, userData }
  - Returns: CareerAnalysis object with JR score
  - **Frontend never calls this**

- ✅ `GET /roles` and `GET /jobs` (server/src/routes/roles.ts, jobs.ts)
  - Return database of roles and jobs from server
  - **Frontend ignores completely, uses hardcoded ROLE_CARDS**

**Verdict**: 🎭 **95% THEATER**

---

#### Substage 2c: Analysis Generation

**Where**: `app/(onboarding)/chat.tsx` lines 1450-1480 (processStep function)

**What frontend does**:

```typescript
// Line 1450-1480 - HARDCODED fake analysis
const analysisData = {
  skills: [
    { name: "Technical Skills", userLevel: 0.65, industryAvg: 0.75 },
    { name: "Communication", userLevel: 0.78, industryAvg: 0.7 },
    // ... 2 more hardcoded skills
  ],
  growthProjection: [
    { month: 0, readiness: 0.45 },
    { month: 3, readiness: 0.62 },
    // ... hardcoded timeline
  ],
  readinessTimeline: "9-12 months", // ← Hardcoded
  generatedAt: new Date().toISOString(),
};

setCareerAnalysis(analysisData); // Store in zustand
```

**What backend does** (server/src/routes/onboarding.ts lines 212-310):

```typescript
// REAL computation based on actual user data
async generateCareerAnalysis(userId, onboardingData) {
  // Calculate skill score: matching skills / required skills
  const skillScore = (matchingSkills.length / requiredSkills.length) * 50;

  // Calculate experience score: years / expected years
  const experienceScore = Math.min(yearsOfExperience, 5) * 20;

  // Calculate education score: qualification level
  const educationScore = isGraduate ? 30 : isStudent ? 15 : 0;

  // JR Score = skill + experience + education
  const jrScore = skillScore + experienceScore + educationScore;

  // Store in CareerAnalysis table
  await db.careerAnalysis.create({
    userId,
    jrScore,
    skills: [...],
    recommendations: [...]
  });

  return { jrScore, skills, recommendations };
}
```

**The disconnect**:

- Backend: Correctly computes JR score based on actual user data
- Frontend: Ignores that entirely, makes up fake scores

**Why this matters**: If you change the user's role selection mid-conversation, the frontend score doesn't change. The JR score is **not derived from actual user input** - it's a static template.

**Verdict**: 🎭 **100% THEATER for frontend** (even though backend is 100% real)

---

### Stage 3: Dashboard (0% core, 100% theater)

#### Path: Analysis Complete → Evaluation Progress → Home Screen

**Where**: `app/(main)/home.tsx` lines 1-548

**What should happen**:

1. Load user's saved onboarding data
2. Calculate JR score from backend computation
3. Load personalized roadmap
4. Load user tasks
5. Load notifications

**What actually happens**:

```typescript
// dashboardStore.ts - All hardcoded defaults
export const useDashboardStore = create<DashboardState>()(
  persist((set) => ({
    // Line 62: HARDCODED jrScore
    jrScore: 78, // ← Why 78? No logic, just a number

    // Line 65: HARDCODED profile steps
    profileSteps: [
      { id: "basic_info", label: "Basic Info", completed: true },
      { id: "education", label: "Education", completed: true },
      { id: "skills", label: "Skills", completed: true },
      { id: "summary", label: "Writing summary...", completed: false },
      { id: "preferences", label: "Preferences", completed: false },
    ],

    // Line 82: HARDCODED roadmap levels
    roadmapLevels: [
      {
        id: "foundation",
        title: "Foundation",
        items: [
          { title: "Complete profile assessment", completed: true },
          { title: "Set career goals", completed: true },
          { title: "Identify skill gaps", completed: false },
        ],
      },
      // ... 3 more hardcoded levels with fake items
    ],

    // Line 300+: HARDCODED tasks
    tasks: [], // Always empty, even though form exists
  }))
);
```

**API integration**: ❌ ZERO

- `home.tsx` reads from `useDashboardStore` only
- Never calls `GET /user/dashboard` (endpoint doesn't exist)
- Never calls `GET /user/profile` (exists but home.tsx doesn't call it)
- Never calls `GET /user/roadmap` (endpoint doesn't exist)
- Never calls `GET /user/tasks` (endpoint doesn't exist)

**What backend provides** (server/src/routes/user.ts):

```typescript
// Line 53-100: GET /user/profile returns
{
  id: userId,
  email: user.email,
  name: user.name,
  onboardingCompleted: user.onboardingCompleted,
  onboardingStatus: user.onboardingStatus,
  // ... but NO jrScore, NO tasks, NO roadmap
}
```

**Missing endpoints**:

- ❌ `GET /user/dashboard` (should return all dashboard data)
- ❌ `GET /user/roadmap` (should return personalized roadmap)
- ❌ `GET /user/tasks` (should return user's tasks)
- ❌ `GET /user/notifications` (should return notifications)
- ❌ `POST /user/tasks` (should create tasks)
- ❌ `PATCH /user/tasks/:id` (should update tasks)

**Verdict**: 🎭 **100% THEATER** - Zero data connection to backend

---

### Stage 4: Explore/Community (0% core, 100% theater)

#### Path: Home Tab → Explore Tab

**Where**: `app/(main)/explore.tsx` lines 1-603

**Data source**:

```typescript
// Line 50-150: Hardcoded mock posts
const MOCK_POSTS = [
  {
    id: "1",
    author: { name: "Sarah Chen", avatar: "..." },
    title: "From Student to Full Stack Developer",
    content: "I completed my degree in 2022...",
    engagement: { likes: 234, comments: 12, shares: 8 },
  },
  // ... 4 more hardcoded posts, exactly the same every time
];
```

**API integration**: ❌ ZERO

- No API call to `GET /community/posts`
- No pagination support
- No sorting/filtering
- No follow/like functionality (buttons shown but disabled)
- No real user interactions

**Backend has community support**?

- ❌ No routes for posts, comments, likes
- ❌ No community tables in schema
- ❌ Complete feature is simulated

**Verdict**: 🎭 **100% THEATER**

---

## CRITICAL DATA FLOW ANALYSIS

### Question: What IS persisted?

| Data                                   | Where Stored           | Synced to Backend? | Survives App Restart? |
| -------------------------------------- | ---------------------- | ------------------ | --------------------- |
| **User identity** (email, name, token) | AsyncStorage + Zustand | ✅ YES (auth)      | ✅ YES                |
| **Onboarding answers**                 | Zustand + local state  | ❌ NO              | ❌ NO                 |
| **Conversation history**               | Local state only       | ❌ NO              | ❌ NO                 |
| **JR Score**                           | Zustand (hardcoded)    | ❌ NO              | ✅ YES (but wrong)    |
| **Career analysis**                    | Zustand (fake data)    | ❌ NO              | ✅ YES (but fake)     |
| **Roadmap progress**                   | Zustand (defaults)     | ❌ NO              | ✅ YES (but defaults) |
| **Tasks**                              | Zustand (empty)        | ❌ NO              | ✅ YES (but empty)    |
| **Notifications**                      | Zustand (empty)        | ❌ NO              | ✅ YES (but empty)    |
| **Profile fields**                     | Chat local state       | ❌ NO              | ❌ NO                 |

**Key insight**: Only **user identity** persists meaningfully. Everything else is either lost or replaced with defaults.

---

### Question: What happens if the app crashes during onboarding?

**Scenario**: User at step 15/35 (asked about college)

- `messages` lost (stored in component state only)
- `userData` lost (local state, not in zustand)
- `progress` saved (in zustand)
- Route to resume: Same. User still at `/(onboarding)/chat`
- Can resume? ❌ **NO** - all questions start over from beginning

**Why**: No persistence mechanism exists. To implement proper resume:

1. Would need to save `currentStep` to backend
2. Would need to fetch chat history on mount
3. Currently neither happens

---

### Question: Can the backend drive the frontend experience?

**Test case**: Suppose backend decides this user should skip questions

**What would need to happen**:

- Backend returns: `{ nextStep: "working_upgrade_goal", skipped: ["ask_age", "ask_gender"] }`
- Frontend fetches this and adapts

**What actually happens**:

- Frontend has hardcoded step sequence
- Backend has no way to customize it
- Frontend ignores backend entirely for question flow

**Verdict**: ❌ **No** - Frontend is completely autonomous for onboarding

---

## ROUTING DECISION TREE

The **only** place where backend truly drives frontend:

```
Request /auth/verify with token
  ↓
Backend returns user object with onboardingStatus field
  ↓
Frontend checks: authService.getRouteForUser(user)
  ↓
if (onboardingStatus === "completed") → /(main)/home
else if (onboardingStatus === "chat") → /(onboarding)/chat
else → /(onboarding)/intro-carousel
  ↓
✅ This works correctly
```

**Everything else**: Frontend state independent of backend

---

## PROBLEM INVENTORY

### Problems from Theater

| #   | Issue                              | Impact                                                      | Fix Effort                           |
| --- | ---------------------------------- | ----------------------------------------------------------- | ------------------------------------ |
| 1   | Onboarding answers never persisted | User loses data on crash; no analytics                      | Medium (add API endpoint)            |
| 2   | Career analysis ignored            | No personalization; JR score meaningless                    | Easy (remove fake data, use backend) |
| 3   | Dashboard hardcoded                | No user-specific content; 1 user × N accounts = same screen | Medium (add dashboard API)           |
| 4   | Community posts fabricated         | Can't show real content; no moderation                      | Medium (build community system)      |
| 5   | Roadmap generic                    | Not personalized to user's role/timeline                    | Medium (add roadmap API)             |
| 6   | Role selection ignored             | User picks role but no downstream effects                   | Easy (trace role through system)     |

### Fragility Points

| Point                          | Why Fragile                     | Consequence                               |
| ------------------------------ | ------------------------------- | ----------------------------------------- |
| CONVERSATION_FLOW constant     | Any change = code deploy        | Can't A/B test, can't iterate             |
| hardcoded progress calculation | Logic in UI                     | Can't change algorithm without app update |
| onboardingStatus field name    | Backend and frontend must match | Renaming breaks routing                   |
| Zustand store defaults         | Hardcoded values                | Same data for all users                   |

---

## CORE vs. THEATER: FINAL VERDICT

### The Core (30%)

```
✅ Authentication
   - Real API calls
   - Real JWT tokens
   - Real database persistence
   - Real route determination

✅ User Identity
   - Email/name fetched from backend
   - Persists across sessions
   - Single source of truth
```

### The Theater (70%)

```
🎭 Onboarding conversation
   - Hardcoded questions
   - No backend integration
   - Data lost on crash

🎭 Career analysis
   - Backend computes real score
   - Frontend ignores it entirely
   - Shows hardcoded fake data

🎭 Dashboard experience
   - All content hardcoded
   - All progress fake/default
   - Zero personalization

🎭 Community content
   - Completely fabricated
   - No backend system exists
   - Same posts for every user

🎭 User roadmap
   - Generic template
   - Not derived from user's role
   - Never updates
```

---

## COMPASS TEST CONCLUSION

**Core Question**: "If I remove all UI beauty, does the app still guide a user correctly?"

**Answer**:

- ✅ **For authentication**: YES - Backend tracks status, routing works
- ❌ **For onboarding**: NO - Conversation is purely client-side theater
- ❌ **For progression**: NO - Career analysis computed but ignored
- ❌ **For personalization**: NO - All content is static defaults
- ❌ **For persistence**: NO - User progress lost between sessions (except auth)

**Overall**: The app guides users through a **predetermined sequence** that looks personalized but is actually **completely generic and hardcoded**. It's a **beautiful facade** with no intelligent backend directing the experience.

**Most damaging reality**: Backend did 80% of the correct architecture work (database, APIs, computation) and frontend did 0% integration with it. They're two separate applications that happen to run in the same process.

---

## ROOT CAUSE ANALYSIS

Why did this happen?

1. **Parallel development**: Backend and frontend teams likely built in parallel without a contract
2. **Frontend prioritized UX**: Beautiful animations, smooth transitions took priority over data integration
3. **MVP mindset misaligned**: Frontend built for "looks good" MVP, backend built for "works correctly" MVP
4. **No API mocking layer**: Frontend mocked data at UI layer instead of HTTP layer (wrong architectural pattern)
5. **Test data became production**: `MOCK_POSTS`, `ROLE_CARDS`, `CONVERSATION_FLOW` meant as temporary became permanent

---

## NEXT STEPS FOR STABILIZATION

### Phase 5: Immediate Actions (Stabilization Roadmap)

**Priority 1: Stop the Bleeding (Week 1)**

- [ ] Implement `POST /onboarding/chat/message` endpoint to persist messages
- [ ] Implement `POST /onboarding/submit` integration in frontend (call when chat.tsx completes)
- [ ] Call backend JR Score instead of hardcoded value in dashboard
- [ ] Add error boundaries and network retry for any API call

**Priority 2: Connect the Dots (Week 2-3)**

- [ ] Implement missing dashboard endpoints
- [ ] Connect home.tsx to `GET /user/dashboard` API
- [ ] Replace MOCK_POSTS with `GET /community/posts`
- [ ] Trace role selection through to personalized content

**Priority 3: Consolidation (Week 4)**

- [ ] Merge /services/auth-service into /server
- [ ] Remove duplicate /apps/mobile/app
- [ ] Eliminate duplicate CONVERSATION_FLOW (in /app and /apps/mobile)
- [ ] Consolidate Prisma schemas

This is a **medium refactor** not a redesign. The backend architecture is sound - we just need to wire it up.
