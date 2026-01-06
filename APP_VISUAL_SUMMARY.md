# EXOPTUS APP - Visual Structure & Features

## 🎯 App Overview

**EXOPTUS** is an AI-driven career navigation app built with React Native & Expo SDK 54.

- **Purpose**: Guide students and professionals through personalized career planning
- **Main Character**: Odyssey - an AI career companion bot
- **Platform**: iOS, Android, Web

---

## 📱 Screen Structure

### **Authentication Flows** (`/app/(auth)`)

#### 1. **Welcome Screen** (`welcome.tsx`)

```
┌─────────────────────────────────┐
│         EXOPTUS Logo            │
│   Your Career Companion         │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │  Continue with Email      │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  Continue with Google     │  │
│  │        🔵 Google Icon     │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Features:**

- Google OAuth integration (when native modules available)
- Email/Magic link authentication
- Smooth animations on entry
- Accessible design

#### 2. **Email Signup** (`signup-email.tsx`)

- Email input validation
- Magic link verification flow

#### 3. **Email Verification** (`email-verification.tsx`)

- OTP or email link confirmation

#### 4. **Verifying** (`verifying.tsx`)

- Deep link handling from email
- Token verification
- Auto-routing based on onboarding status

---

### **Onboarding Chat Flow** (`/app/(onboarding)`)

#### 1. **Intro Carousel** (`intro-carousel.tsx`)

```
┌─────────────────────────────────┐
│                                 │
│   Welcome to Exoptus! 🚀         │
│                                 │
│   [Carousel of features]        │
│                                 │
│   → Continue                    │
└─────────────────────────────────┘
```

#### 2. **Chat Interface** (`chat.tsx`) - **Core Experience**

```
┌──────────────────────────────────┐
│  Odyssey's Avatar  [   ]  Close  │
├──────────────────────────────────┤
│                                  │
│  Odyssey: "Hey there! 👋"        │
│  I'm Odyssey, your career        │
│  companion...                    │
│                                  │
│  You: "I'm interested in tech"  │
│                                  │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Software Engineer   ↑        │ │
│ │ Data Scientist              │ │
│ │ Product Manager             │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │  [Type your response...]     │ │
│ │                        [Send] │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Chat Flow Questions (Progressive):**

1. ✅ Name (text input)
2. ✅ Consent form (acknowledge data collection)
3. ✅ Current status (Student/Graduate/Working)
4. ✅ Gender
5. ✅ Age (numeric)
6. ✅ Location
7. **Branch Based on Status:**
   - **Student:**
     - College name
     - Course & stream
     - Current semester
     - Familiar subjects (multi-select)
     - CGPA
     - Career aspiration
   - **Graduate:**
     - College name
     - Course completed
     - Graduation year
     - Familiar subjects
     - Final CGPA
     - Resume upload
     - Career goals
   - **Working Professional:**
     - Resume upload
     - Office ID upload (optional)
     - Career upgrade goal
8. ✅ Role selection (visual cards)
9. ✅ Analysis phase

**Input Types Supported:**

- `text` - Free text input
- `chips` - Single select buttons
- `multi-chips` - Multi-select (subjects)
- `numeric` - Age, semester, year, CGPA
- `location` - State/city picker
- `file` - Resume & office ID upload
- `role-cards` - Visual role cards
- `consent` - Checkbox consent
- `none` - Display only (no input)

#### 3. **Evaluation Progress** (`evaluation-progress.tsx`)

```
┌─────────────────────────────────┐
│  Analyzing Your Profile...      │
│                                 │
│  [Animated progress bar]        │
│                                 │
│  • Extracting skills           │
│  • Comparing to market         │
│  • Building roadmap            │
└─────────────────────────────────┘
```

#### 4. **Analysis Results** (`analysis-results.tsx`)

```
┌─────────────────────────────────┐
│  Career Analysis Report         │
├─────────────────────────────────┤
│  🎯 Your Target Role            │
│  Full Stack Developer           │
│                                 │
│  📊 Skill Match: 65%            │
│  ███████░░░                     │
│                                 │
│  🔥 Top Skills:                 │
│  • React                        │
│  • Node.js                      │
│  • JavaScript                   │
│                                 │
│  ⚠️  Gaps:                      │
│  • AWS/DevOps                   │
│  • System Design                │
│                                 │
│  ⏱️  Timeline: 6-9 months       │
│                                 │
│  [View Roadmap] [Start Journey] │
└─────────────────────────────────┘
```

#### 5. **Analysis Complete** (`analysis-complete.tsx`)

```
┌─────────────────────────────────┐
│                                 │
│      🎉 All Set!                │
│                                 │
│  Your personalized roadmap      │
│  is ready!                      │
│                                 │
│  [Animated celebration]         │
│                                 │
│  [Start Exploring] [Save & Exit]│
└─────────────────────────────────┘
```

---

### **Main App Screens** (`/app/(main)`)

#### 1. **Home** (`home.tsx`)

```
┌──────────────────────────────────┐
│  Welcome Back, Gowthram! 👋      │
├──────────────────────────────────┤
│  📊 JR Score: 65/100             │
│  [Progress ring]                 │
│                                  │
│  🎯 Your Current Goal:           │
│  Full Stack Developer (6 mo)     │
│                                  │
│  📚 Next Steps:                  │
│  [ ] Learn AWS                   │
│  [ ] Complete 3 projects         │
│                                  │
│  ⭐ Tips for Today:              │
│  → Practice system design        │
│  → Read about microservices      │
└──────────────────────────────────┘
```

#### 2. **Odyssey** (`odyssey.tsx`)

- Chat with Odyssey AI companion
- Ask career questions
- Get personalized recommendations

#### 3. **Roadmap** (`roadmap.tsx`)

```
┌──────────────────────────────────┐
│  Your 6-Month Roadmap            │
├──────────────────────────────────┤
│  🟢 Phase 1: Foundations (2mo)   │
│  ├─ Complete: React Basics       │
│  ├─ Complete: Node.js Intro      │
│  └─ TODO: Express.js             │
│                                  │
│  🟡 Phase 2: Projects (2mo)      │
│  ├─ TODO: Build Portfolio App    │
│  ├─ TODO: Connect to Backend     │
│  └─ TODO: Deploy                 │
│                                  │
│  🔴 Phase 3: Advanced (2mo)      │
│  ├─ TODO: System Design          │
│  ├─ TODO: AWS/DevOps             │
│  └─ TODO: Interview Prep         │
└──────────────────────────────────┘
```

#### 4. **Explore** (`explore.tsx`)

- Browse recommended learning resources
- Filter by skill, difficulty, format
- Integration with Udemy/Coursera (future)

#### 5. **Resume** (`resume.tsx`)

- Upload and analyze resume
- Get feedback on improvements
- Track resume versions

#### 6. **Profile** (`profile.tsx`)

```
┌──────────────────────────────────┐
│  👤 Gowthram P                   │
│                                  │
│  📧 gowthram@example.com         │
│  🎓 Student | IIT Delhi          │
│  🎯 Target: Full Stack Dev       │
│                                  │
│  🔐 Account Settings             │
│  ┌──────────────────────────────┐│
│  │ Change Password              ││
│  │ Data Privacy                 ││
│  │ Delete Account               ││
│  │ Logout                       ││
│  └──────────────────────────────┘│
└──────────────────────────────────┘
```

#### 7. **Notifications** (`notifications.tsx`)

- Course recommendations
- Progress milestones
- Reconnect nudges

---

## 🎨 Design & UX

### **Color Scheme**

- **Primary**: Deep Blue (`#1B3A8C`)
- **Secondary**: Vibrant Purple (`#7C3AED`)
- **Accent**: Neon Green (`#10B981`)
- **Backgrounds**: Gradient (dark theme)
- **Text**: White & Light Gray

### **Components & Animations**

- **LinearGradient** backgrounds
- **Reanimated** smooth transitions
- **Gesture Handler** for swipes
- **Lottie** for Odyssey avatar animations
- **GlassCard** components (glass morphism)

### **Navigation**

- **Tab-based**: Home, Odyssey, Roadmap, Resume, Profile
- **Stack-based**: Auth flows
- **Deep linking**: Email magic links, OAuth callbacks

---

## 🔗 API Integration

### **Backend Endpoints** (from `/server`)

```
POST /auth/email/start          → Send magic link
POST /auth/email/verify         → Verify link token
POST /auth/google               → Google OAuth
GET  /user/profile              → Fetch user
PUT  /user/profile              → Update profile
POST /onboarding/submit         → Save onboarding
POST /onboarding/analysis       → Get career analysis
GET  /roles                     → Get role cards
GET  /roadmap/{roleId}          → Fetch roadmap
```

---

## 📦 State Management

### **Zustand Stores**

- **`userStore`** - User auth state, profile data
- **`onboardingStore`** - Onboarding progress, responses
- **`dashboardStore`** - Home screen data, JR score

---

## 🚀 To View the App

### **Option 1: Expo Go (Mobile)**

1. Download Expo Go from App Store / Play Store
2. Ensure it's SDK 54 compatible (✅ now upgraded)
3. Open the QR code link from terminal

### **Option 2: Web (Development)**

- React Native Web dependencies need alignment
- Build: `npm run build`
- Run: `npx expo start --web`

### **Option 3: Native Build**

- Android: `npm run android:dev`
- iOS: `npm run ios` (macOS only)

---

## ✅ Phase 1 Status

- ✅ Server boots on port 3000
- ✅ Single backend (no duplicates)
- ✅ Single mobile app
- ✅ SDK 54 (upgraded from 49)
- ✅ All console.logs removed
- ✅ Type safety aligned

**Next: Phase 2** - Feature depth, performance, AI integration
