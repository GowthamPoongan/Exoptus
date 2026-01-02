# EXOPTUS Backend Implementation Guide

## 🚀 Phase 1: Complete - Data Submission & Career Analysis

### What's Implemented

✅ **POST /onboarding/submit** - Accept and store all 20 onboarding fields  
✅ **Career Analysis Engine** - Calculate JR Score (0-100) + skill gaps  
✅ **Role & Job Models** - Database of 6 sample roles and jobs  
✅ **GET /roles** - List all roles with filtering  
✅ **GET /jobs** - Search and filter job listings  
✅ **GET /jobs/recommended/:userId** - Personalized job recommendations

---

## 📋 FREE Cloud Setup (No AWS Needed!)

### Option 1: Supabase (Recommended for PostgreSQL)

```bash
1. Go to https://supabase.com (Free tier: 500MB storage)
2. Create new project
3. Copy DATABASE_URL from settings
4. Update server/.env:
   DATABASE_URL="postgresql://user:pass@db.supabase.co/postgres"
```

### Option 2: Railway.app (Simple hosting + free tier)

```bash
1. Go to https://railway.app
2. Connect GitHub repo
3. Auto-deploy from main branch
4. Free $5/month credit
```

### Option 3: Render.com (Alternative)

```bash
1. Go to https://render.com
2. Deploy Node.js app
3. Free tier includes PostgreSQL
```

---

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Update Database (Supabase)

```bash
# Create tables for new models
npx prisma migrate dev --name add_career_models

# Generate Prisma client
npx prisma generate
```

### 3. Seed Sample Data

```bash
# Populate roles and jobs
npx ts-node scripts/seed.ts
```

### 4. Start Server

```bash
npm run dev
```

Server will start on `http://10.175.216.47:3000`

---

## 📡 API Endpoints

### Onboarding Submission

#### **POST /onboarding/submit**

Submit all onboarding data from chat screen

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Doe",
  "gender": "Male",
  "age": 22,
  "state": "California",
  "city": "San Francisco",
  "status": "Student",
  "college": "UC Berkeley",
  "course": "B.Tech",
  "stream": "Computer Science",
  "semester": 6,
  "passoutYear": 2025,
  "cgpa": 3.8,
  "subjects": ["JavaScript", "React", "Python", "SQL"],
  "careerAspiration": "Build scalable web applications",
  "selectedRoleName": "Frontend Developer",
  "selectedRoleId": "role-id-123",
  "expectedSalary": "$80,000 - $120,000",
  "resumeUrl": "https://cdn.example.com/resume.pdf",
  "officeIdUrl": "https://cdn.example.com/id.pdf",
  "flowPath": "student"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Onboarding data saved successfully",
  "data": {
    "onboarding": {
      "id": "uuid",
      "userId": "uuid",
      "name": "John Doe",
      "status": "Student",
      "completedAt": "2026-01-02T10:30:00Z"
    },
    "analysis": {
      "jrScore": 65,
      "skillGap": 35,
      "topRole": "Frontend Developer",
      "topRoleMatch": 85,
      "missingSkills": ["TypeScript", "React Native"]
    }
  }
}
```

#### **GET /onboarding/profile**

Retrieve user's onboarding profile and analysis

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "profile": { ... },
    "analysis": { ... }
  }
}
```

---

### Roles

#### **GET /roles**

List all available roles

**Query Parameters:**

```
?category=Frontend
?difficulty=intermediate
?minSalary=50000&maxSalary=120000
?search=Developer
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Frontend Developer",
      "description": "Build responsive UIs",
      "salaryMin": 50000,
      "salaryMax": 100000,
      "skillsRequired": ["React", "JavaScript", "HTML/CSS"],
      "experienceYears": 1,
      "category": "Frontend",
      "difficulty": "intermediate",
      "demandLevel": "high",
      "_count": {
        "jobs": 5
      }
    }
  ],
  "count": 1
}
```

#### **GET /roles/:id**

Get single role with job listings

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Frontend Developer",
    "skillsRequired": ["React", "JavaScript"],
    "jobs": [
      {
        "id": "uuid",
        "title": "Senior Frontend Developer",
        "company": "TechCorp",
        "location": "San Francisco, CA",
        "salaryMin": 120000,
        "salaryMax": 180000
      }
    ]
  }
}
```

#### **GET /roles/matches/:userId**

Get role recommendations for specific user

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Frontend Developer",
      "skillsRequired": ["React", "JavaScript"]
    },
    {
      "id": "uuid",
      "title": "Full Stack Developer",
      "skillsRequired": ["React", "Node.js", "JavaScript"]
    }
  ],
  "topRole": "Frontend Developer",
  "topRoleMatch": 85
}
```

---

### Jobs

#### **GET /jobs**

Search and filter jobs

**Query Parameters:**

```
?roleId=uuid
?location=San Francisco
?minSalary=80000&maxSalary=150000
?search=Developer
?limit=20&offset=0
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Senior Frontend Developer",
      "description": "5+ years building React apps",
      "company": "TechCorp",
      "location": "San Francisco, CA",
      "salaryMin": 120000,
      "salaryMax": 180000,
      "postedAt": "2026-01-02T10:00:00Z",
      "expiresAt": "2026-02-01T10:00:00Z",
      "role": {
        "id": "uuid",
        "title": "Frontend Developer",
        "category": "Frontend"
      }
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 45
  }
}
```

#### **GET /jobs/:id**

Get single job details

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior Frontend Developer",
    "description": "5+ years building React apps",
    "company": "TechCorp",
    "location": "San Francisco, CA",
    "salaryMin": 120000,
    "salaryMax": 180000,
    "role": {
      "id": "uuid",
      "title": "Frontend Developer",
      "skillsRequired": ["React", "JavaScript", "TypeScript"],
      "category": "Frontend"
    }
  }
}
```

#### **GET /jobs/recommended/:userId**

Get personalized job recommendations

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Frontend Developer",
      "company": "StartupXYZ",
      "location": "Remote",
      "salaryMin": 80000,
      "salaryMax": 130000,
      "role": {
        "title": "Frontend Developer",
        "category": "Frontend"
      }
    }
  ],
  "recommendations": {
    "topRole": "Frontend Developer",
    "matchPercentage": 85
  }
}
```

---

## 🧠 Career Analysis Algorithm

**JR Score** = Skill Score (50%) + Experience Score (20%) + Education Score (30%)

### Skill Score

```
(matched_skills / required_skills) * 100 * 0.5
```

### Experience Score

- Student: +5 points
- Graduate: +15 points
- Working: +25 points

### Education Score

- Student: +15 points
- Recent Graduate (0-1 yr): +20 points
- 1-2 years experience: +25 points
- 2+ years experience: +30 points

### Skill Gap

```
100 - (matched_skills / required_skills * 100)
```

### Growth Projection

- Current JR < 50: 12 months to reach 90+
- 50-75: 6 months
- 75-90: 3 months
- 90+: Already at target

---

## 📝 Database Schema

### User (Existing)

```
id, email, name, googleId, jrScore, onboardingCompleted
```

### OnboardingProfile (New)

```
id, userId, name, gender, age, college, course, status,
subjects (JSON), careerAspiration, selectedRoleId,
resumeUrl, officeIdUrl, completedAt
```

### CareerAnalysis (New)

```
id, userId, jrScore (0-100), skillGap (%),
topRole, topRoleMatch (%), matchedRoleIds,
missingSkills (JSON), growthMatrix (JSON), estimatedMonths
```

### Role (New)

```
id, title, description, salaryMin, salaryMax,
skillsRequired (JSON), experienceYears,
category, difficulty, demandLevel
```

### Job (New)

```
id, title, company, location, description,
salaryMin, salaryMax, roleId, postedAt, expiresAt
```

---

## 🔌 Connect Frontend to Backend

### In chat.tsx

```typescript
// After user completes onboarding
const handleSubmitOnboarding = async () => {
  try {
    const response = await fetch(
      "http://10.175.216.47:3000/onboarding/submit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          name: userData.name,
          gender: userData.gender,
          age: userData.age,
          status: userData.status,
          college: userData.college,
          subjects: userData.skills,
          careerAspiration: userData.aspiration,
          selectedRoleName: userData.selectedRole,
          // ... all other fields
        }),
      }
    );

    const result = await response.json();
    if (result.success) {
      // Update store with real analysis
      setCareerAnalysis(result.data.analysis);
      // Navigate to analysis-results screen
      router.push("/(onboarding)/analysis-results");
    }
  } catch (error) {
    console.error("Failed to submit onboarding:", error);
  }
};
```

### In analysis-results.tsx

```typescript
// Fetch real data instead of using mock
useEffect(() => {
  fetchAnalysis();
}, []);

const fetchAnalysis = async () => {
  const response = await fetch(`http://10.175.216.47:3000/onboarding/profile`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  const result = await response.json();
  if (result.success) {
    // Update UI with real JR Score, skill gaps, growth matrix
    setAnalysis(result.data.analysis);
  }
};
```

---

## ✅ Testing Checklist

- [ ] Database migration runs without errors
- [ ] Seed script populates 6 roles + 6 sample jobs
- [ ] POST /onboarding/submit stores all fields correctly
- [ ] JR Score calculates between 0-100
- [ ] GET /roles returns all roles with filtered results
- [ ] GET /jobs returns paginated, filterable results
- [ ] GET /jobs/recommended/:userId returns matching jobs
- [ ] Frontend submits data on onboarding completion
- [ ] Analysis results display real data (not mock)

---

## 📊 Next Steps (Phase 2)

1. **Resume Processing** - Integrate file upload + parsing
2. **Admin Dashboard** - View users, analytics, onboarding completion
3. **Skill Gap Visualization** - Better growth matrix UI
4. **Job Alerts** - Email when matching jobs posted
5. **User Analytics** - Track funnel, dropoff rates

---

## 🆘 Troubleshooting

**Error: "OnboardingProfile model not found"**

```
Run: npx prisma migrate dev --name add_career_models
```

**Jobs not appearing**

```
Run: npx ts-node scripts/seed.ts
```

**JR Score showing 0**

```
Check that matched skills are calculated correctly in algorithm
Log the matchedSkills array to verify
```

**Frontend can't connect to /onboarding/submit**

```
Ensure API_URL in .env is correct: http://10.175.216.47:3000
Check firewall allows port 3000
Verify Authorization header has valid JWT token
```

---

## 📚 Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Supabase Free Tier**: https://supabase.com
- **Railway Deployment**: https://railway.app
- **Express.js Guide**: https://expressjs.com

---

## 💡 Cost Summary (Development)

| Service                 | Free Tier        | Monthly Cost     |
| ----------------------- | ---------------- | ---------------- |
| Supabase                | 500MB PostgreSQL | $0               |
| Railway                 | $5 credit        | $0 (with credit) |
| Cloudinary (next phase) | 25GB storage     | $0               |
| **Total**               |                  | **$0**           |

**When you scale to production**, these will cost:

- PostgreSQL: ~$15/month (5GB)
- Server: ~$25/month (1GB RAM)
- File storage: ~$5-20/month depending on usage

---

Generated: January 2, 2026  
Framework: Node.js + Express + Prisma  
Database: PostgreSQL (Supabase)
