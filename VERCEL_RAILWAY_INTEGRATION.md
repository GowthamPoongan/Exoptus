# 🔗 Vercel + Railway Integration Guide

## ✅ Your Railway Backend is Live!

**Backend URL**: `https://exoptus-server-production.up.railway.app`

## 🎯 Step 1: Update Google OAuth (CRITICAL)

### Google Cloud Console

Go to: https://console.cloud.google.com/apis/credentials

1. Click on your OAuth 2.0 Client ID: `463755159994-qh29mpi9dsbp90gf5id3q3id1m3eluie.apps.googleusercontent.com`

2. **Authorized JavaScript Origins** - Add these:

   ```
   https://exoptus-server-production.up.railway.app
   https://exoptus-web-dashboard.vercel.app
   http://localhost:3000
   ```

3. **Authorized Redirect URIs** - Add these:

   ```
   https://exoptus-server-production.up.railway.app/auth/google/callback
   https://exoptus-web-dashboard.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

4. Click **Save**

✅ **GOOGLE_REDIRECT_URI is already updated in Railway!**

---

## 🚀 Step 2: Deploy Web Dashboard to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/new

2. Import your GitHub repository: `GowthamPoongan/Exoptus`

3. **Configure Project**:

   - **Framework Preset**: Next.js (or detect automatically)
   - **Root Directory**: `apps/web-dashboard` (if your dashboard is there)
   - **Build Command**: `npm run build` or auto-detect
   - **Output Directory**: `.next` or auto-detect

4. **Environment Variables** - Add these:

   ```
   NEXT_PUBLIC_API_URL=https://exoptus-server-production.up.railway.app
   NEXTAUTH_URL=https://your-vercel-domain.vercel.app
   NEXTAUTH_SECRET=your-secret-here-generate-one
   GOOGLE_CLIENT_ID=463755159994-qh29mpi9dsbp90gf5id3q3id1m3eluie.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   ```

5. Click **Deploy**

### Option B: Via Vercel CLI

```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd apps/web-dashboard
vercel

# For production
vercel --prod
```

---

## 🔄 How Vercel + Railway Work Together

### Architecture:

```
┌─────────────────┐      API Requests      ┌─────────────────┐
│   Vercel        │ ───────────────────────>│   Railway       │
│  (Frontend)     │                         │   (Backend)     │
│  Next.js/React  │ <───────────────────────│   Node.js +     │
│                 │      JSON Responses     │   PostgreSQL    │
└─────────────────┘                         └─────────────────┘
       │                                             │
       │                                             │
       ▼                                             ▼
  Static Pages                              Database (Supabase)
  Serverless Functions                      + Business Logic
  (Edge/Lambdas)                           + Authentication
```

### What Each Platform Does:

**Vercel (Frontend)**:

- Hosts your Next.js/React web dashboard
- Serves static pages at edge locations (fast!)
- Handles frontend routing
- Makes API calls to Railway backend
- Perfect for: UI, user interactions, client-side logic

**Railway (Backend)**:

- Runs your Node.js Express server
- Connects to PostgreSQL database (Supabase)
- Handles authentication (Google OAuth)
- Processes business logic
- Sends emails via SMTP
- Perfect for: API endpoints, database operations, server logic

---

## 🧪 Step 3: Test the Integration

### Test Backend Health

```bash
curl https://exoptus-server-production.up.railway.app/health
```

Expected: `{"status":"ok"}`

### Test Google OAuth Flow

1. Go to your Vercel deployed site
2. Click "Sign in with Google"
3. Should redirect to Google → back to your Vercel site
4. Check Railway logs: `railway logs --service exoptus-server`

### Test API Connection

In your web dashboard, check if API calls work:

- User registration
- Login
- Profile fetch

---

## 📱 Step 4: Update Expo App (Mobile)

### Update Expo Environment Variables

Create/update `app.config.js` or `.env`:

```javascript
// app.config.js
export default {
  // ... other config
  extra: {
    apiUrl: "https://exoptus-server-production.up.railway.app",
    // or use environment variables
  },
};
```

Or in `.env.production`:

```
EXPO_PUBLIC_API_URL=https://exoptus-server-production.up.railway.app
```

### Update API Service

In `services/api.ts`:

```typescript
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://exoptus-server-production.up.railway.app";
```

---

## 🔐 Environment Variables Summary

### Railway (Backend) - ✅ Already Set

```
DATABASE_URL=postgresql://...
JWT_SECRET=exoptus-prod-jwt-2026-...
GOOGLE_CLIENT_ID=463755159994-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://exoptus-server-production.up.railway.app/auth/google/callback
FRONTEND_URL=https://exoptus-web-dashboard.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=gowthampcsbs2023@jerusalemengg.ac.in
SMTP_PASS=cpanftubcoxswlte
NODE_ENV=production
```

### Vercel (Frontend) - ⏳ To Set

```
NEXT_PUBLIC_API_URL=https://exoptus-server-production.up.railway.app
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=generate-with-openssl
GOOGLE_CLIENT_ID=463755159994-qh29mpi9dsbp90gf5id3q3id1m3eluie.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Expo (Mobile) - ⏳ To Set Later

```
EXPO_PUBLIC_API_URL=https://exoptus-server-production.up.railway.app
```

---

## 🔄 Continuous Deployment (Auto-Deploy)

### How It Works:

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Update feature"
   git push
   ```

2. **Automatic Deployments**:

   - **Railway**: Watches `phase-1-stabilization` branch → Auto-deploys backend
   - **Vercel**: Watches your branch → Auto-deploys frontend

3. **Zero Downtime**: Both platforms handle rolling deployments

### Branch Strategy:

```
main/master → Production (Vercel + Railway)
phase-1-stabilization → Staging/Development
feature/* → Preview deployments (Vercel)
```

---

## 🛠️ Useful Commands

### Railway

```powershell
# View logs
railway logs --service exoptus-server

# Check variables
railway variables --service exoptus-server

# Open dashboard
railway open

# Deploy manually (if needed)
cd server
railway up
```

### Vercel

```powershell
# View logs
vercel logs your-deployment-url

# Check deployments
vercel ls

# Open dashboard
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL
```

---

## ✅ Integration Checklist

- [x] Railway backend deployed
- [x] Railway domain generated
- [x] GOOGLE_REDIRECT_URI updated in Railway
- [ ] Google Cloud Console OAuth settings updated
- [ ] Vercel project created
- [ ] Vercel environment variables set
- [ ] Vercel deployed
- [ ] Test Google sign-in on Vercel site
- [ ] Test API calls from Vercel to Railway
- [ ] Update Expo app configuration (later)

---

## 🎉 Benefits of This Setup

✅ **Scalability**: Both platforms auto-scale
✅ **Performance**: Vercel edge network + Railway compute
✅ **Cost-Effective**: Free tiers available, pay as you grow
✅ **Easy Deployments**: Git push = auto-deploy
✅ **HTTPS by Default**: Secure connections everywhere
✅ **Global CDN**: Vercel serves static assets globally
✅ **Separation of Concerns**: Frontend ≠ Backend

---

## 🆘 Troubleshooting

### Issue: "Failed to fetch" on Vercel

**Solution**: Check CORS settings in Railway backend:

```javascript
// server/src/index.ts
app.use(
  cors({
    origin: [
      "https://exoptus-web-dashboard.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
```

### Issue: Google OAuth Fails

**Solution**: Verify all redirect URIs in Google Console match exactly

### Issue: Environment Variables Not Working

**Solution**:

- Railway: Redeploy after adding variables
- Vercel: Redeploy after adding variables
- Expo: Restart dev server after changing .env

---

## 📞 Next Steps

1. ✅ Update Google OAuth (do this first!)
2. 🚀 Deploy to Vercel
3. 🧪 Test the full flow
4. 📱 Update Expo app later

Your backend is ready! Focus on Vercel deployment next.
