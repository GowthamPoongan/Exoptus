# 🎯 RAILWAY DEPLOYMENT - QUICK START

## ✅ What's Done

1. ✅ Railway CLI installed
2. ✅ Project linked: `compassionate-determination`
3. ✅ All environment variables set in Railway
4. ✅ Railway configuration files created
5. ✅ Code pushed to GitHub
6. ✅ Railway dashboard opened

## 🎬 NEXT: Deploy via Dashboard (5 minutes)

### Railway Dashboard is Now Open

You should see your `compassionate-determination` project.

### Complete These Steps:

#### 1️⃣ Connect GitHub (Critical)

Click **exoptus-server** service → **Settings** → **Source**

- Click **Connect Repo**
- Select: `GowthamPoongan/Exoptus`
- Branch: `phase-1-stabilization` (or `main`)
- **ROOT DIRECTORY**: `server` ⚠️ **CRITICAL - DO NOT SKIP**

#### 2️⃣ Verify Build Settings

In **Settings** → **Build & Deploy**:

- Build Command: `npm install && npx prisma generate`
- Start Command: `npm run start`
- (Should auto-detect, but verify)

#### 3️⃣ Deploy

Click **Deploy** button or it will auto-deploy after connecting repo.

Watch logs for: `🚀 EXOPTUS Server running on port 3000`

#### 4️⃣ Generate Public URL

Go to **Settings** → **Networking** → **Generate Domain**

You'll get something like:

```
https://exoptus-server-production.up.railway.app
```

**Copy this URL** - you'll need it next!

## 🔐 After Getting Railway URL

### Update Google OAuth

Go to: https://console.cloud.google.com/apis/credentials

**Authorized JavaScript Origins:**

```
https://exoptus-server-production.up.railway.app
https://exoptus-web-dashboard.vercel.app
```

**Authorized Redirect URIs:**

```
https://exoptus-server-production.up.railway.app/auth/google/callback
https://exoptus-web-dashboard.vercel.app/auth/callback
```

### Update GOOGLE_REDIRECT_URI in Railway

Run this command (replace with your actual Railway URL):

```powershell
railway variables --service exoptus-server --set "GOOGLE_REDIRECT_URI=https://exoptus-server-production.up.railway.app/auth/google/callback"
```

## ✅ Test Your Backend

Once deployed, test these endpoints:

### Health Check

```bash
curl https://your-railway-url.railway.app/health
```

### Test Google OAuth Flow

1. Go to your web dashboard
2. Click "Sign in with Google"
3. Should redirect correctly to Railway backend

## 📱 Update Frontend Apps

### Web Dashboard (Vercel)

Add environment variable:

```
NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app
```

### Expo App (Later)

In `.env.production` or Expo secrets:

```
EXPO_PUBLIC_API_URL=https://your-railway-url.railway.app
```

## 🔍 Useful Commands

```powershell
# View logs
railway logs --service exoptus-server

# Check variables
railway variables --service exoptus-server

# Open dashboard
railway open

# Redeploy
cd server
railway up
```

## ❌ Why CLI Upload Failed?

The `railway up` command timed out due to network/size issues. Dashboard deployment via GitHub is more reliable for full applications.

## 📋 Deployment Checklist

- [ ] Dashboard open
- [ ] GitHub repo connected
- [ ] Root directory set to `server`
- [ ] Deployment triggered
- [ ] Domain generated
- [ ] Google OAuth updated with Railway URL
- [ ] GOOGLE_REDIRECT_URI environment variable updated
- [ ] Tested health endpoint
- [ ] Tested Google sign-in
- [ ] Updated web dashboard API URL

## 🎉 You're Done When...

You can successfully:

1. Hit the health endpoint
2. Sign in with Google on web dashboard
3. See backend logs showing successful requests

---

**Current Status**: Railway dashboard is open and ready for GitHub integration!
