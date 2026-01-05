# Exoptus Admin Dashboard

Beautiful, real-time admin dashboard for managing Exoptus platform data.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Server running on `http://10.175.216.47:3000`
- Admin key from your server

### Installation & Run

```bash
# Navigate to dashboard directory
cd c:\Projects\Exoptus\apps\web-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The dashboard will automatically open at `http://localhost:5173`

## 🔑 Admin Authentication

1. When you first load the dashboard, you'll be prompted for an admin key
2. Default key: `admin-secret-key-change-in-prod`
3. Your key will be saved in browser's localStorage

To change the admin key:

- Click the 🔑 button in the top-right corner
- Enter your new key

## 📊 Features

### Tabs

- **Overview** - Dashboard statistics and quick summary
- **Users** - All users with search, JR scores, onboarding status
- **Analytics** - JR score distribution chart, top career choices
- **Jobs** - Job listings with salary ranges
- **Roles** - Available job roles with difficulty levels

### Real-Time Updates

- Auto-refreshes every 30 seconds
- Manual refresh with 🔄 button
- Last updated timestamp in header

## 🛠️ API Connection

Dashboard connects to:

- API URL: `http://10.175.216.47:3000`
- Admin endpoints: `/admin/stats`, `/admin/users`, `/admin/analytics/*`, etc.
- Authentication: `x-admin-key` header

## 🎨 Customization

### Colors

Change gradient colors in `src/components/AdminDashboard.tsx`:

```typescript
const GRADIENT_PRIMARY = "#0575E6";
const GRADIENT_DARK = "#021B79";
```

### API URL

Change server URL:

```typescript
const API_URL = "http://10.175.216.47:3000";
```

## 📦 Build for Production

```bash
npm run build
```

Output will be in `dist/` folder

## 🐛 Troubleshooting

**Dashboard shows "Loading..."**

- Check if server is running on port 3000
- Verify admin key is correct
- Check browser console for errors

**API calls failing**

- Ensure API_URL is correct
- Check server admin key matches
- Verify firewall allows connections

**Authentication fails**

- Click 🔑 button and re-enter correct key
- Check `.env` on server for correct ADMIN_KEY value

## 📝 Project Structure

```
web-dashboard/
├── src/
│   ├── components/
│   │   └── AdminDashboard.tsx    # Main dashboard component
│   ├── App.tsx                    # App root
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── index.html                     # HTML template
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript config
└── package.json                   # Dependencies
```

## 🎯 Next Steps

1. Run the dashboard: `npm run dev`
2. Enter admin key when prompted
3. Explore different tabs
4. Make changes to backend and watch real-time updates

---

**Happy monitoring! 🎉**
