# 📊 EXOPTUS Complete Management System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Mobile App (React Native/Expo)                         │
│  - Onboarding chat                                      │
│  - Job search                                           │
│  - Profile/Dashboard                                    │
└────────────────────┬────────────────────────────────────┘
                     │ API Calls
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Backend Server (Node.js/Express)                       │
│  - Port: 3000                                           │
│  - URL: http://10.175.216.47:3000                      │
│                                                          │
│  API Routes:                                            │
│  ├─ /auth          - Authentication                    │
│  ├─ /onboarding    - Chat data & analysis              │
│  ├─ /user          - User profile management           │
│  ├─ /roles         - Job roles database                │
│  ├─ /jobs          - Job listings                      │
│  └─ /admin         - Admin management (NEW)            │
└────────────────────┬────────────────────────────────────┘
                     │ Database Queries
                     ↓
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL Database (Supabase)                         │
│                                                          │
│  Tables:                                                │
│  ├─ users                    - User accounts            │
│  ├─ onboarding_profiles      - Chat data (20 fields)   │
│  ├─ career_analysis          - JR Score & results      │
│  ├─ roles                    - Job titles/requirements  │
│  ├─ jobs                     - Job postings            │
│  ├─ user_feedback            - Ratings/comments        │
│  └─ auth_sessions            - Session tracking        │
└─────────────────────────────────────────────────────────┘
        ↑
        │ Browse/Manage
        │
┌─────────────────────────────────────────────────────────┐
│  Admin Dashboard (HTML/JS)                              │
│  - View all users                                       │
│  - Analytics                                            │
│  - Manage jobs/roles                                    │
│  - Database explorer (Prisma Studio)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Where to View Everything

### **1. Database Explorer (GUI)**

View, edit, and manage all data visually:

```bash
cd c:\Projects\Exoptus\server
npx prisma studio
```

Opens: **http://localhost:5555**

**Features:**

- ✅ Browse all users, onboarding data, jobs, roles
- ✅ Edit data directly in the GUI
- ✅ Add new records
- ✅ Delete records
- ✅ Real-time updates
- ✅ Search & filter

**Tables Available:**

- `users` - All user accounts (email, name, JR score)
- `onboarding_profiles` - Chat data (20 fields per user)
- `career_analysis` - JR Score, skill gaps, recommendations
- `roles` - Job titles, salary, skills required
- `jobs` - Job postings
- `auth_sessions` - Active sessions
- `user_feedback` - Ratings/comments

---

### **2. Admin Dashboard (Web Interface)**

Open the admin dashboard to view analytics and manage data:

**File:** `/admin-dashboard.html`

**How to use:**

1. Open in browser: Right-click file → Open with → Browser
2. Enter admin key: `admin-secret-key-change-in-prod`
3. Click "Connect"

**Or use direct URL:**

```
file:///c:/Projects/Exoptus/admin-dashboard.html
```

**Features:**

- 📊 Real-time statistics (total users, completion rate, avg JR score)
- 👥 User management (search, view details)
- 📈 Analytics dashboard (JR score distribution, top roles)
- 💼 Job management (view all jobs)
- 🎯 Role management (view all roles)
- 📉 Onboarding analytics
- 💾 Data export (GDPR compliance)

**Tabs Available:**

1. **Overview** - Key metrics and charts
2. **Users** - List all users with search
3. **Analytics** - JR score distribution, top roles
4. **Jobs** - All job postings
5. **Roles** - All job roles

---

### **3. Database (PostgreSQL - Supabase)**

Access your PostgreSQL database directly:

**Setup (One-time):**

1. Go to https://supabase.com
2. Create free account
3. Create new project
4. Copy `DATABASE_URL`
5. Update `server/.env`: `DATABASE_URL="postgresql://..."`

**Access Database:**

```
Supabase Dashboard → Your Project → SQL Editor
```

**Example queries:**

```sql
-- View all users
SELECT id, email, name, jr_score FROM users;

-- View onboarding completion rate
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed,
  ROUND(100.0 * COUNT(CASE WHEN onboarding_completed = true THEN 1 END) / COUNT(*), 2) as completion_rate
FROM users;

-- Top career aspirations
SELECT career_aspiration, COUNT(*) as count
FROM onboarding_profiles
GROUP BY career_aspiration
ORDER BY count DESC;

-- Average JR score by role
SELECT top_role, AVG(jr_score) as avg_score, COUNT(*) as count
FROM career_analysis
GROUP BY top_role
ORDER BY avg_score DESC;
```

---

### **4. Server & APIs**

**Server Status:**
Terminal shows server running on port 3000:

```
🚀 EXOPTUS Server running on port 3000
📍 Health check: http://localhost:3000/health
📱 Mobile access: http://10.175.216.47:3000
```

**Test Health Check:**

```bash
curl http://10.175.216.47:3000/health
# Returns: {"status":"ok","timestamp":"2026-01-02T..."}
```

**API Endpoints Reference:**

| Endpoint                      | Method | Purpose                  | Auth |
| ----------------------------- | ------ | ------------------------ | ---- |
| `/health`                     | GET    | Server status            | ❌   |
| `/auth/email/register`        | POST   | Register with email      | ❌   |
| `/auth/email/verify`          | POST   | Verify magic link        | ❌   |
| `/onboarding/submit`          | POST   | Submit chat data         | ✅   |
| `/onboarding/profile`         | GET    | Fetch user analysis      | ✅   |
| `/roles`                      | GET    | List all roles           | ❌   |
| `/jobs`                       | GET    | Search jobs              | ❌   |
| `/jobs/recommended/:userId`   | GET    | Personal recommendations | ❌   |
| `/admin/stats`                | GET    | Dashboard statistics     | 🔑   |
| `/admin/users`                | GET    | List all users           | 🔑   |
| `/admin/users/:userId`        | GET    | User details             | 🔑   |
| `/admin/analytics/onboarding` | GET    | Onboarding analytics     | 🔑   |
| `/admin/analytics/jr-score`   | GET    | JR score distribution    | 🔑   |
| `/admin/jobs`                 | GET    | All jobs (admin)         | 🔑   |
| `/admin/roles`                | GET    | All roles (admin)        | 🔑   |

**Legend:** ❌ = No auth, ✅ = JWT required, 🔑 = Admin key required

---

## 🔑 Admin Key Management

**Default Admin Key:**

```
admin-secret-key-change-in-prod
```

**Change Admin Key:**
Update `.env` file:

```
ADMIN_KEY="your-new-secure-key-here"
```

**Use in API Requests:**

```bash
curl -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/stats
```

---

## 📈 Admin API Endpoints

### Get Dashboard Statistics

```bash
curl -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/stats
```

Response:

```json
{
  "success": true,
  "data": {
    "totalUsers": 42,
    "completedOnboarding": 28,
    "onboardingCompletionRate": "67%",
    "averageJRScore": 62.5,
    "totalJobs": 6,
    "totalRoles": 6
  }
}
```

### List All Users

```bash
curl -H "x-admin-key: admin-secret-key-change-in-prod" \
  "http://10.175.216.47:3000/admin/users?limit=20&offset=0"
```

### Get User Details

```bash
curl -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/users/{userId}
```

### Get Analytics

```bash
# Onboarding analytics
curl -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/analytics/onboarding

# JR Score distribution
curl -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/analytics/jr-score
```

### Export All Users (GDPR)

```bash
curl -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/export/users \
  -o users-export.json
```

### Delete User

```bash
curl -X DELETE \
  -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/users/{userId}
```

---

## 🚀 Quick Start

### Step 1: Start Everything

```bash
cd c:\Projects\Exoptus\server
npm run setup
```

### Step 2: Open Database Explorer

```bash
npx prisma studio
```

Opens: **http://localhost:5555**

### Step 3: Open Admin Dashboard

Open file: **c:\Projects\Exoptus\admin-dashboard.html**
Enter key: `admin-secret-key-change-in-prod`

### Step 4: Test APIs

```bash
# Get stats
curl -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/stats | jq
```

---

## 📊 Viewing Different Data Types

### View All Users

**Option 1: Prisma Studio**

1. Open http://localhost:5555
2. Click "users" table
3. See all users with email, name, JR score

**Option 2: Admin Dashboard**

1. Open admin-dashboard.html
2. Click "Users" tab
3. See users with completion status

**Option 3: PostgreSQL**

```sql
SELECT id, email, name, jr_score, onboarding_completed FROM users;
```

---

### View Onboarding Data

**Option 1: Prisma Studio**

1. Open http://localhost:5555
2. Click "onboarding_profiles" table
3. See all 20 fields per user

**Option 2: Admin Dashboard**

1. Click "Users" tab
2. See user status (Student/Graduate/Working)
3. See college, career aspiration

**Option 3: PostgreSQL**

```sql
SELECT user_id, name, status, college, career_aspiration FROM onboarding_profiles;
```

---

### View Career Analysis

**Option 1: Prisma Studio**

1. Open http://localhost:5555
2. Click "career_analysis" table
3. See JR Score, skill gap, top role

**Option 2: Admin Dashboard**

1. Click "Analytics" tab
2. See JR score distribution
3. See top roles selected

**Option 3: API**

```bash
curl -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/analytics/jr-score
```

---

### View Jobs & Roles

**Option 1: Prisma Studio**

1. Click "jobs" or "roles" table
2. Edit, add, or delete records

**Option 2: Admin Dashboard**

1. Click "Jobs" or "Roles" tabs
2. View all listings

**Option 3: API**

```bash
curl http://10.175.216.47:3000/roles
curl http://10.175.216.47:3000/jobs
```

---

## 🛡️ Data Management & GDPR

### Export User Data

```bash
curl -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/export/users \
  -o users-backup.json
```

### Delete User (GDPR Right to Erasure)

```bash
curl -X DELETE \
  -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/users/{userId}
```

**Note:** Deleting a user cascades to delete:

- Onboarding profile
- Career analysis
- All sessions
- All feedback

---

## 📱 Mobile App Integration

### Submit Onboarding Data

From your React Native app:

```typescript
await fetch("http://10.175.216.47:3000/onboarding/submit", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwtToken}`,
  },
  body: JSON.stringify({
    name: "John Doe",
    age: 22,
    status: "Student",
    college: "UC Berkeley",
    subjects: ["JavaScript", "React", "Python"],
    careerAspiration: "Build web apps",
    selectedRoleName: "Frontend Developer",
    // ... all other 20 fields
  }),
});
```

### Fetch Analysis

```typescript
const response = await fetch("http://10.175.216.47:3000/onboarding/profile", {
  headers: {
    Authorization: `Bearer ${jwtToken}`,
  },
});
const { data } = await response.json();
// Use data.analysis.jrScore, topRole, missingSkills, etc.
```

---

## 🔍 Monitoring & Troubleshooting

### Check Server Health

```bash
curl http://10.175.216.47:3000/health
```

### View Server Logs

Terminal where server is running shows:

- Request logs
- Database queries
- Errors
- Analysis calculations

### Database Connection

```bash
# Test connection from .env
npx prisma db execute --stdin < /dev/null

# Or run migrations
npx prisma migrate status
```

### Common Issues

**"Admin key invalid"**

- Check `ADMIN_KEY` in `.env`
- Default: `admin-secret-key-change-in-prod`

**"Database connection failed"**

- Ensure `DATABASE_URL` in `.env` is correct
- Check PostgreSQL is running (if self-hosted)

**"Table doesn't exist"**

- Run: `npx prisma migrate dev`
- Then: `npx ts-node scripts/seed.ts`

---

## 💰 Cost Analysis

| Component    | Service                | Monthly Cost |
| ------------ | ---------------------- | ------------ |
| Database     | Supabase (free tier)   | $0           |
| Server       | Railway.app            | $0-5         |
| File Storage | Cloudinary (free tier) | $0           |
| **Total**    |                        | **$0-5/mo**  |

---

## 📋 Summary

You now have a **complete management system** with:

✅ **Database Explorer** (Prisma Studio) - Browse/edit all data  
✅ **Admin Dashboard** (Web UI) - View analytics, manage users  
✅ **Backend APIs** - Full CRUD operations  
✅ **PostgreSQL Database** - Production-ready  
✅ **GDPR Compliance** - Export & delete user data  
✅ **Real-time Analytics** - Onboarding rates, JR score distribution

**Everything is FREE and ready to scale!**

---

Generated: January 2, 2026  
Last Updated: Phase 1 Complete + Admin System
