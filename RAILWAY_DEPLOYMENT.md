# 🚂 Railway Backend Deployment Guide

## ✅ Setup Complete

Your Railway project is configured and environment variables are set:

- **Project**: compassionate-determination
- **Service**: exoptus-server
- **Environment**: production

## 🎯 Deploy via Railway Dashboard (RECOMMENDED)

Since CLI upload timed out, use the Railway dashboard for GitHub integration:

### Step 1: Open Railway Dashboard

Go to: https://railway.app/project/a791964f-7ce6-42a2-9fce-de7785ae41ed

### Step 2: Configure GitHub Deployment

1. Click on **exoptus-server** service
2. Go to **Settings** tab
3. Under **Source**, click **Connect Repo**
4. Select: `GowthamPoongan/Exoptus`
5. Set branch: `phase-1-stabilization` (or `main`)

### Step 3: CRITICAL - Set Root Directory

⚠️ **THIS IS CRITICAL** - Railway must deploy from the `server` folder:

1. In **Settings** → **Build**
2. Set **Root Directory**: `server`
3. Build Command (auto-detected): `npm install && npx prisma generate`
4. Start Command (auto-detected): `npm run start`

### Step 4: Deploy

1. Click **Deploy** or push to your branch
2. Watch logs in the **Deployments** tab
3. Look for: `🚀 EXOPTUS Server running on port 3000`

### Step 5: Get Your Railway URL

1. Go to **Settings** → **Networking**
2. Click **Generate Domain**
3. You'll get something like: `exoptus-server-production.up.railway.app`

## 🔑 Update Google OAuth (CRITICAL)

Once you have your Railway URL, update Google Cloud Console:

### Google Cloud Console

Go to: https://console.cloud.google.com/apis/credentials

1. Select your OAuth 2.0 Client ID
2. Add to **Authorized JavaScript Origins**:

   ```
   https://exoptus-server-production.up.railway.app
   https://exoptus-web-dashboard.vercel.app
   ```

3. Add to **Authorized Redirect URIs**:
   ```
   https://exoptus-server-production.up.railway.app/auth/google/callback
   https://exoptus-web-dashboard.vercel.app/auth/callback
   ```

### Update Railway Environment Variable

```powershell
railway variables --service exoptus-server --set "GOOGLE_REDIRECT_URI=https://exoptus-server-production.up.railway.app/auth/google/callback"
```

## 📱 Update Frontend (Web Dashboard)

In your Vercel deployment, set:

```
NEXT_PUBLIC_API_URL=https://exoptus-server-production.up.railway.app
```

## 📱 Update Expo App (Later)

In your Expo app's `.env`:

```
EXPO_PUBLIC_API_URL=https://exoptus-server-production.up.railway.app
```

## 🧪 Test Your Deployment

### Health Check

```bash
curl https://exoptus-server-production.up.railway.app/health
```

### Test Google OAuth

1. Go to your web dashboard
2. Click "Sign in with Google"
3. Should work without redirect errors

## 📋 Environment Variables Already Set

✅ All variables are configured in Railway:

- DATABASE_URL (Supabase)
- JWT_SECRET
- SMTP credentials
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- FRONTEND_URL
- All other required variables

## 🔄 Redeploy After Changes

### Option 1: Git Push (Automatic)

```bash
git add .
git commit -m "your changes"
git push origin phase-1-stabilization
```

Railway will auto-deploy.

### Option 2: Manual Redeploy

In Railway dashboard → Deployments → Click "Redeploy"

### Option 3: CLI (if you're in server directory)

```bash
cd server
railway up
```

## 🛠️ Useful Railway Commands

```powershell
# Check variables
railway variables --service exoptus-server

# View logs
railway logs --service exoptus-server

# Open dashboard
railway open
```

## 🎉 Next Steps

1. ✅ Deploy backend to Railway (using dashboard)
2. ⏳ Get Railway URL
3. ⏳ Update Google OAuth settings
4. ⏳ Update web dashboard NEXT_PUBLIC_API_URL
5. ⏳ Test Google sign-in
6. ⏳ Later: Update Expo app configuration
