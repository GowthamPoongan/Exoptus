# 🎯 EXOPTUS Management System - Quick Reference

## 📍 Where Everything Is

| What                | Where                 | How to Access                               |
| ------------------- | --------------------- | ------------------------------------------- |
| **Database GUI**    | Prisma Studio         | `npx prisma studio` → http://localhost:5555 |
| **Admin Dashboard** | HTML File             | `/admin-dashboard.html` in browser          |
| **Server Status**   | Terminal              | Running in terminal window                  |
| **Database**        | PostgreSQL (Supabase) | https://supabase.com → Your Project         |
| **All Users**       | Prisma Studio         | Click `users` table                         |
| **Onboarding Data** | Prisma Studio         | Click `onboarding_profiles` table           |
| **Career Analysis** | Prisma Studio         | Click `career_analysis` table               |
| **Jobs & Roles**    | Admin Dashboard       | "Jobs" & "Roles" tabs                       |
| **Analytics**       | Admin Dashboard       | "Analytics" tab                             |

---

## 🔌 API Reference

### Public Endpoints (No Auth)

```bash
# Get all roles
curl http://10.175.216.47:3000/roles

# Search jobs
curl "http://10.175.216.47:3000/jobs?location=San%20Francisco"

# Server health
curl http://10.175.216.47:3000/health
```

### Admin Endpoints (Requires Admin Key)

```bash
KEY="admin-secret-key-change-in-prod"

# Dashboard stats
curl -H "x-admin-key: $KEY" http://10.175.216.47:3000/admin/stats

# List all users
curl -H "x-admin-key: $KEY" http://10.175.216.47:3000/admin/users

# Analytics
curl -H "x-admin-key: $KEY" http://10.175.216.47:3000/admin/analytics/jr-score

# Export users
curl -H "x-admin-key: $KEY" http://10.175.216.47:3000/admin/export/users -o users.json
```

---

## 📊 What You Can See

### Total Users

- **Where:** Prisma Studio → `users` table
- **Count:** SQL: `SELECT COUNT(*) FROM users`
- **Dashboard:** Top stat card shows total users

### Onboarding Completion

- **Where:** Admin Dashboard → "Overview" tab
- **Details:** Shows completed vs pending in chart
- **Rate:** `completion_rate = completed_onboarding / total_users * 100`

### JR Scores

- **Where:** Prisma Studio → `career_analysis` table
- **Dashboard:** "Analytics" tab shows distribution (0-20, 20-40, etc.)
- **Average:** SQL: `SELECT AVG(jr_score) FROM career_analysis`

### Career Aspirations

- **Where:** Prisma Studio → `onboarding_profiles` table → filter `careerAspiration`
- **Dashboard:** "Analytics" tab → top career aspirations chart
- **SQL:** `SELECT career_aspiration, COUNT(*) FROM onboarding_profiles GROUP BY career_aspiration`

### Jobs by Role

- **Where:** Admin Dashboard → "Jobs" tab
- **Filter:** Shows company, location, salary, role
- **Add New:** Use API: `POST /admin/jobs`

---

## 🚀 Commands Reference

```bash
# Start everything (generate, seed, run)
cd c:\Projects\Exoptus\server
npm run setup

# Just start server
npm run dev

# Open database GUI
npx prisma studio

# Seed sample data
npx ts-node scripts/seed.ts

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open database studio
npx prisma studio

# View database URL
cat .env | grep DATABASE_URL
```

---

## 🔐 Admin Key

**Location:** `.env` file

```
ADMIN_KEY=admin-secret-key-change-in-prod
```

**Change it to:**

```
ADMIN_KEY=your-new-secure-key-123
```

**Use in requests:**

```bash
-H "x-admin-key: your-new-secure-key-123"
```

---

## 📈 Analytics You Can Generate

### SQL Queries

```sql
-- Onboarding completion rate
SELECT
  COUNT(*) total_users,
  COUNT(CASE WHEN onboarding_completed THEN 1 END) completed,
  ROUND(100.0 * COUNT(CASE WHEN onboarding_completed THEN 1 END) / COUNT(*), 1) pct
FROM users;

-- Average JR score by status
SELECT
  op.status,
  AVG(ca.jr_score) avg_score,
  COUNT(*) count
FROM onboarding_profiles op
LEFT JOIN career_analysis ca ON op.user_id = ca.user_id
GROUP BY op.status;

-- Top careers chosen
SELECT career_aspiration, COUNT(*) count
FROM onboarding_profiles
WHERE career_aspiration IS NOT NULL
GROUP BY career_aspiration
ORDER BY count DESC;

-- JR score distribution
SELECT
  CASE
    WHEN jr_score < 20 THEN '0-20'
    WHEN jr_score < 40 THEN '20-40'
    WHEN jr_score < 60 THEN '40-60'
    WHEN jr_score < 80 THEN '60-80'
    ELSE '80-100'
  END range,
  COUNT(*) count
FROM career_analysis
GROUP BY range
ORDER BY range;

-- Most popular target roles
SELECT top_role, COUNT(*) count
FROM career_analysis
WHERE top_role IS NOT NULL
GROUP BY top_role
ORDER BY count DESC;

-- Active jobs by company
SELECT company, COUNT(*) count
FROM jobs
WHERE expires_at > NOW()
GROUP BY company;
```

---

## 🎛️ Data Management

### View User Details

1. **Prisma Studio:** Click user row → see all 20+ fields
2. **Admin Dashboard:** Users tab → search by email
3. **API:** `GET /admin/users/{userId}` with admin key

### Edit Data

1. **Prisma Studio:** Click field → edit directly → auto-saves
2. **API:** Need to create PUT/PATCH endpoints

### Delete Data

1. **Prisma Studio:** Click row → delete button (cascades)
2. **API:** `DELETE /admin/users/{userId}` with admin key

### Export Data (GDPR)

```bash
curl -H "x-admin-key: admin-secret-key-change-in-prod" \
  http://10.175.216.47:3000/admin/export/users -o backup.json
```

---

## 🛠️ Troubleshooting

| Problem                   | Solution                            |
| ------------------------- | ----------------------------------- |
| Server won't start        | `npm install` then `npm run setup`  |
| Prisma Studio won't open  | `npx prisma generate` first         |
| No data showing           | `npx ts-node scripts/seed.ts`       |
| Admin key doesn't work    | Check `.env` file for correct key   |
| Can't connect to database | Verify `DATABASE_URL` in `.env`     |
| JR Scores all 0           | Check onboarding data was submitted |

---

## 🔄 Typical Workflow

**1. Monitor Users**

```bash
Prisma Studio → users table → see new registrations
```

**2. Check Onboarding Rate**

```bash
Admin Dashboard → Overview tab → see completion % chart
```

**3. View Analysis Results**

```bash
Prisma Studio → career_analysis table → see JR scores
```

**4. Check Job Recommendations**

```bash
Admin Dashboard → Analytics tab → see top roles
```

**5. Manage Job Listings**

```bash
Admin Dashboard → Jobs tab → add/edit/delete jobs
```

**6. Export User Data**

```bash
curl -H "x-admin-key: ..." /admin/export/users -o backup.json
```

---

## 📱 Mobile App Status

Connected to these endpoints:

- ✅ `/auth/email/register` - Sign up
- ✅ `/auth/email/verify` - Verify magic link
- ✅ `/onboarding/submit` - Save chat data
- ✅ `/roles` - Show job roles
- ✅ `/jobs` - Search jobs

**To connect:**
Update `services/api.ts` to POST onboarding data:

```typescript
await fetch("http://10.175.216.47:3000/onboarding/submit", {...})
```

---

## 💾 Database Tables

| Table                 | Records | Purpose              |
| --------------------- | ------- | -------------------- |
| `users`               | ~50     | User accounts        |
| `onboarding_profiles` | ~35     | Submitted chat data  |
| `career_analysis`     | ~30     | JR scores & analysis |
| `roles`               | 6       | Sample job titles    |
| `jobs`                | 6       | Sample job postings  |
| `auth_sessions`       | ~100    | Active sessions      |
| `user_feedback`       | ~5      | Ratings/comments     |

---

## ✅ Checklist

- [ ] Server running: `npm run setup`
- [ ] Prisma Studio open: `npx prisma studio`
- [ ] Admin Dashboard loaded: `/admin-dashboard.html`
- [ ] Database seeded: 6 roles + 6 jobs visible
- [ ] Can view users: Prisma Studio → users table
- [ ] Can view onboarding: Prisma Studio → onboarding_profiles
- [ ] Can see analytics: Admin Dashboard → Analytics tab
- [ ] Admin API working: `curl /admin/stats` with key

---

**All systems GO! 🚀**

Last Updated: January 2, 2026
