# 🚀 EXOPTUS - Complete Startup Guide

## ✅ What's Been Set Up

### 1. **Admin Dashboard Web** (React + Vite)

- Location: `apps/web-dashboard/`
- Port: `http://localhost:5173`
- Type: Pure React website
- Tech: Vite, React, TypeScript

### 2. **Mobile App** (React Native)

- Location: `apps/mobile/`
- Port: `http://localhost:8081`
- Type: Expo app

### 3. **Server** (Express + Prisma)

- Location: `server/`
- Port: `http://10.175.216.47:3000`
- Type: Node.js API

---

## 🎯 Quick Start (3 Steps)

### Step 1: Navigate to Project Root

```powershell
cd c:\Projects\Exoptus
```

### Step 2: Install All Dependencies

```powershell
npm install
```

This installs dependencies for:

- Root monorepo
- Admin dashboard
- Mobile app
- Server
- All packages

### Step 3: Start Everything

```powershell
npm run dev
```

**OR use the launcher script:**

```powershell
# PowerShell
.\start-all.ps1

# Command Prompt
.\start-all.bat
```

---

## 🔌 What Starts

When you run `npm run dev`, this starts automatically:

```
┌─────────────────────────────────────────┐
│   Admin Dashboard (React)               │
│   http://localhost:5173                 │
│   - Overview, Users, Analytics, Jobs    │
│   - Real-time API data                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   Mobile App (Expo)                     │
│   http://localhost:8081                 │
│   - Onboarding flow                     │
│   - Profile, Home, Roles                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   Server (Express + Prisma)             │
│   http://10.175.216.47:3000             │
│   - User API                            │
│   - Onboarding API                      │
│   - Admin API                           │
└─────────────────────────────────────────┘
```

---

## 🔐 Admin Dashboard Authentication

### First Time:

1. Open: http://localhost:5173
2. A modal will ask for admin key
3. Enter: `admin-secret-key-change-in-prod`
4. Click "Set Key" - it's saved in localStorage

### Access Points:

- **Dashboard**: http://localhost:5173
- **Users Tab**: See all users with JR scores
- **Analytics Tab**: JR score distribution, top roles
- **Jobs Tab**: All job listings
- **Roles Tab**: Career roles with details

### Change Admin Key:

1. Edit `server/.env`
2. Update `ADMIN_KEY=your-new-key`
3. Restart server
4. Update in dashboard modal

---

## 📋 Individual Service Control

### Run Just Admin Dashboard:

```powershell
cd apps\web-dashboard
npm run dev
```

Opens: http://localhost:5173

### Run Just Mobile App:

```powershell
cd apps\mobile
npm run start
```

Opens: http://localhost:8081

### Run Just Server:

```powershell
cd server
npm run dev
```

Runs on: http://10.175.216.47:3000

---

## 🛠️ Useful Commands

### Root Level:

```powershell
npm run dev              # All services
npm run dev:mobile      # Mobile only
npm run dev:admin       # Admin dashboard only
npm run dev:server      # Server only
npm run build           # Build all for production
npm run db:studio       # Open Prisma Studio (database GUI)
```

### Admin Dashboard:

```powershell
cd apps/web-dashboard
npm run dev             # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
```

### Mobile App:

```powershell
cd apps/mobile
npm run start           # Start Expo
npm run android         # Android build
npm run ios            # iOS build
```

### Server:

```powershell
cd server
npm run dev             # Start with hot reload
npm run db:migrate      # Run migrations
npm run db:studio       # Database explorer
npm run db:push         # Push schema to database
```

---

## 🌐 API Endpoints Available

### Admin Endpoints (require `x-admin-key` header):

```
GET  /admin/stats                          # Dashboard metrics
GET  /admin/users?limit=20                 # User list
GET  /admin/analytics/jr-score             # JR score analytics
GET  /admin/jobs?limit=20                  # Jobs list
GET  /admin/roles?limit=20                 # Roles list
POST /admin/roles                          # Create role
POST /admin/jobs                           # Create job
```

### Onboarding Endpoints:

```
POST /onboarding/submit                    # Save onboarding data
GET  /onboarding/profile/:userId           # Get saved profile
```

### Public Endpoints:

```
GET  /roles                                # All roles
GET  /roles/:id                            # Single role
GET  /jobs                                 # Search jobs
GET  /jobs/:id                             # Single job
```

---

## 📊 Dashboard Features

### Overview Tab

- 6 stat cards: Users, Completion, Rate, JR Score, Jobs, Roles
- Summary section with key metrics
- Color-coded cards with icons

### Users Tab

- Search by name or email
- Shows JR score for each user
- Onboarding status (✅ Completed / ⏳ Pending)
- Paginated list

### Analytics Tab

- Average JR Score display
- Bar chart showing JR score distribution
- Top career choices with counts
- Real-time data visualization

### Jobs Tab

- All active jobs
- Company, location, salary range
- Organized in cards

### Roles Tab

- All career roles
- Experience requirements
- Salary ranges
- Difficulty levels (Easy/Medium/Hard)

---

## 🎨 Design Colors

### Gradient Used:

- **Primary Blue**: `#0575E6`
- **Dark Blue**: `#021B79`
- **Success Green**: `#10B981`
- **Warning Orange**: `#F59E0B`
- **Danger Red**: `#EF4444`

---

## 🔄 Real-Time Features

✅ **Auto-refresh**: Every 30 seconds  
✅ **Manual refresh**: Click "🔄 Refresh Data" button  
✅ **Last updated**: Shows timestamp in header  
✅ **Live connections**: All tabs update simultaneously

---

## 🐛 Troubleshooting

### "Admin Dashboard won't load"

```powershell
cd apps/web-dashboard
npm install
npm run dev
```

### "Port 5173 already in use"

```powershell
# Find process
Get-Process -Id $(Get-NetTCPConnection -LocalPort 5173).OwningProcess

# Kill it
taskkill /PID <PID> /F
```

### "Cannot connect to server API"

- Check server is running: `npm run dev:server`
- Verify IP: `ipconfig` (should be 10.175.216.47)
- Check admin key in `.env`

### "Admin key doesn't work"

- Restart server
- Clear localStorage: F12 → Application → Storage → Clear All
- Re-enter key

### "node_modules issues"

```powershell
npm run clean           # Removes all node_modules
npm install             # Reinstall everything
```

---

## 📱 Mobile App Connection

The mobile app connects to the same server:

- API URL: `http://10.175.216.47:3000`
- Onboarding data saved to `/onboarding/submit`
- User authentication via JWT tokens

---

## 🚀 Production Deployment

### Build Everything:

```powershell
npm run build
```

Creates:

- `apps/web-dashboard/dist/` - Ready for hosting
- Mobile APK/IPA files
- Compiled server

### Deploy Admin Dashboard:

```powershell
# Upload apps/web-dashboard/dist/ to your host
# Update API_URL to production server
```

---

## ✅ Verification Checklist

- [ ] Node.js 20+ installed: `node -v`
- [ ] npm 10+ installed: `npm -v`
- [ ] Dependencies installed: `npm install` ran successfully
- [ ] Server starts: `npm run dev:server` works
- [ ] Admin dashboard loads: http://localhost:5173 opens
- [ ] Admin key accepted: Can set and save key
- [ ] Stats loading: Dashboard shows data
- [ ] Users visible: Users tab shows data
- [ ] Analytics working: Charts render

---

## 📞 Support

If something goes wrong:

1. **Check logs** - Look at terminal output
2. **Restart** - Kill terminal and run again
3. **Clear cache** - `npm run clean && npm install`
4. **Check ports** - Make sure 5173, 8081, 3000 are free

---

**Everything is ready! Start with:**

```powershell
npm run dev
```

Or use the launcher:

```powershell
.\start-all.ps1
```

Enjoy! 🎉
