# Admin Dashboard Web Setup

## 📍 Project Structure

```
Exoptus/
├── apps/
│   ├── mobile/              # React Native app
│   └── web-dashboard/       # React admin dashboard (Vite)
├── server/                  # Express backend
└── package.json            # Root monorepo
```

## 🚀 Quick Start

### Option 1: Run Everything Together (Recommended)

```bash
cd c:\Projects\Exoptus
npm install                 # Install all dependencies
npm run dev                 # Runs: Mobile + Admin Dashboard + Server
```

This will start:

- 📱 Mobile app (Expo) on http://localhost:8081
- 🌐 Admin Dashboard on http://localhost:5173
- 🖥️ Server API on http://10.175.216.47:3000

### Option 2: Run Individual Services

**Admin Dashboard Only:**

```bash
cd c:\Projects\Exoptus\apps\web-dashboard
npm run dev                 # Starts on http://localhost:5173
```

**Mobile App Only:**

```bash
cd c:\Projects\Exoptus\apps\mobile
npm run start               # Starts on http://localhost:8081
```

**Server Only:**

```bash
cd c:\Projects\Exoptus\server
npm run dev                 # Starts on http://10.175.216.47:3000
```

## 🔐 Admin Authentication

1. Open Admin Dashboard: http://localhost:5173
2. Enter admin key when prompted
3. Default key: `admin-secret-key-change-in-prod`

To change the key, edit `.env` in `/server`:

```env
ADMIN_KEY=your-new-secure-key
```

## 📊 Dashboard Features

### Tabs Available:

- **Overview** - Statistics & metrics
- **Users** - User list with search
- **Analytics** - JR Score distribution, top roles
- **Jobs** - Job listings
- **Roles** - Career roles

### Real-Time Updates:

- Auto-refreshes every 30 seconds
- Click "🔄 Refresh Data" for instant update
- Live connection status indicator

## 🌐 Access Points

| Service         | URL                       | Port |
| --------------- | ------------------------- | ---- |
| Admin Dashboard | http://localhost:5173     | 5173 |
| Mobile App      | http://localhost:8081     | 8081 |
| Server API      | http://10.175.216.47:3000 | 3000 |
| Prisma Studio   | http://localhost:5555     | 5555 |

## 🛠️ Build for Production

```bash
# Build all services
npm run build

# Build only admin dashboard
cd apps/web-dashboard
npm run build              # Creates optimized build in dist/

# Preview production build
npm run preview
```

## 🐛 Troubleshooting

### Admin Dashboard won't load

```bash
cd apps/web-dashboard
npm install                # Reinstall dependencies
npm run dev                # Try again
```

### Connection error to API

- Check server is running: `npm run dev:server`
- Verify API_URL in `AdminDashboard.tsx` matches your server IP
- Default: `http://10.175.216.47:3000`

### Admin key not working

- Check key in `.env` file in `/server`
- Make sure server is running (it validates the key)

### Port already in use

```bash
# Find process using port 5173
netstat -ano | findstr :5173

# Kill it
taskkill /PID <PID> /F

# Or use different port in vite.config.ts
```

## 📝 Scripts Reference

**Root Directory:**

- `npm run dev` - Run all services
- `npm run dev:mobile` - Mobile app only
- `npm run dev:admin` - Admin dashboard only
- `npm run dev:server` - Server only
- `npm run build` - Build all
- `npm run db:studio` - Open Prisma Studio

**Admin Dashboard Directory:**

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview build

## 🎨 Design System

### Colors (Gradient)

- Primary: `#0575E6`
- Dark: `#021B79`
- Success: `#10B981`
- Warning: `#F59E0B`
- Danger: `#EF4444`

### Responsive Design

- Desktop: 1400px max-width
- Tablet: 768px breakpoint
- Mobile: Full width

## 🔄 Data Flow

```
Admin Dashboard (React)
        ↓
   API Requests
        ↓
   Server (Express)
        ↓
  Database (PostgreSQL)
```

## 📱 API Endpoints Used

```typescript
// Admin only (require x-admin-key header)
GET    /admin/stats
GET    /admin/users?limit=20
GET    /admin/analytics/jr-score
GET    /admin/jobs?limit=20
GET    /admin/roles?limit=20
```

## ✅ Ready to Deploy

When ready for production:

1. Build: `npm run build`
2. Upload `apps/web-dashboard/dist/` to your hosting
3. Update API_URL to production server
4. Set secure admin key in server `.env`

---

**All systems GO! 🚀**
