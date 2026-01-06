# EXOPTUS - Complete Development Guide

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Local Development Setup](#local-development-setup)
3. [Backend Configuration](#backend-configuration)
4. [Email & SMTP](#email--smtp)
5. [Google OAuth](#google-oauth)
6. [Troubleshooting](#troubleshooting)
7. [Database & Prisma](#database--prisma)
8. [Deployment](#deployment)

---

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI
- Git

### Start Development Servers

```bash
# Terminal 1: Backend
cd server
npm run dev
# Should see: 🚀 EXOPTUS Server running on port 3000

# Terminal 2: Expo App
npx expo start --clear
# Scan QR code with Expo Go
```

---

## Local Development Setup

### IP Configuration

Your local IP: `192.168.1.22`

**All these files must match:**

| File          | Variable                 | Value                      |
| ------------- | ------------------------ | -------------------------- |
| `server/.env` | `SERVER_URL`             | `http://192.168.1.22:3000` |
| `server/.env` | `APP_BASE_URL`           | `http://192.168.1.22:3000` |
| `root/.env`   | `EXPO_PUBLIC_API_URL`    | `http://192.168.1.22:3000` |
| `root/.env`   | `EXPO_PUBLIC_SERVER_URL` | `http://192.168.1.22:3000` |

### Change IP

If your IP changes:

```bash
ipconfig
# Find IPv4 Address
# Update all 4 places above
```

---

## Backend Configuration

### Server URL Behavior

```
Development:        http://192.168.1.22:3000  (local network)
Production:         https://[railway-url]     (deployed)
```

The `SERVER_URL` determines:

- Where email links point to
- Where Google OAuth redirects to
- Where your app connects to

**For Google OAuth to work locally**, the URL must be registered in Google Cloud Console.

---

## Email & SMTP

### Gmail Configuration

1. **Create App Password** at https://myaccount.google.com/apppasswords
2. **Add to `server/.env`:**
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="16-character-password"
   EMAIL_FROM="Exoptus <your-email@gmail.com>"
   ```

### Email Verification Flow

1. User clicks "Sign in with Email"
2. Backend generates magic link
3. Email sent **non-blocking** (background)
4. API responds immediately (<100ms)
5. User receives email with verification link

### Troubleshooting Emails

| Issue              | Cause                     | Fix                                |
| ------------------ | ------------------------- | ---------------------------------- |
| No email received  | Wrong SMTP credentials    | Check Gmail password in `.env`     |
| Email slow (2-10s) | Blocking SMTP call        | Should be fixed - non-blocking now |
| Database error     | Connection pool exhausted | Restart backend                    |

---

## Google OAuth

### Setup Requirements

1. **Google Cloud Console Credentials**

   - Client ID: `463755159994-qh29mpi9dsbp90gf5id3q3id1m3eluie.apps.googleusercontent.com`
   - Client Secret: `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`

2. **Register Redirect URI**

   - Go: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID
   - Add authorized redirect URI:
     ```
     http://192.168.1.22:3000/auth/google/callback
     ```

3. **Add Test User**
   - Go: https://console.cloud.google.com/apis/credentials/consent
   - Add test user: `kidslaughing200@gmail.com`
   - This allows development signin without published app

### Google OAuth Flow

```
┌─ Expo App
│  └─> User clicks "Sign in with Google"
│
├─> Opens browser
│  └─> https://accounts.google.com/oauth2/auth?...
│
├─> User signs in & grants permission
│
├─> Redirected to: http://192.168.1.22:3000/auth/google/callback
│
├─> Backend exchanges code for JWT
│
└─> Deep link back to app with token
   └─> App authenticated ✓
```

### Errors & Fixes

| Error                   | Cause                     | Fix                             |
| ----------------------- | ------------------------- | ------------------------------- |
| `redirect_uri_mismatch` | URL not in Google Console | Add to authorized redirect URIs |
| `access_denied`         | Test user not added       | Add at OAuth Consent Screen     |
| `invalid_client`        | Wrong Client ID           | Check `.env` GOOGLE_CLIENT_ID   |
| Authorization blocks    | Security check            | Clear device cache, retry       |

---

## Troubleshooting

### Server Issues

**Server won't start:**

```bash
# Kill existing Node processes
Get-Process node | Stop-Process -Force

# Restart
cd server && npm run dev
```

**Port 3000 already in use:**

```bash
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Database Issues

**"MaxClientsInSessionMode: max clients reached"**

- Solution: Restart backend (closes connections)
- Cause: Too many concurrent connections to Supabase

**Prisma errors:**

- Clear node_modules: `rm -r node_modules`
- Reinstall: `npm install`
- Regenerate client: `npx prisma generate`

### Expo App Issues

**App won't connect to backend:**

1. Check IP is correct: `ipconfig`
2. Verify `.env` has correct URL
3. Reload app: Press `r` in Expo terminal

**QR code expired:**

```bash
npx expo start --clear
```

---

## Database & Prisma

### Connection

**Current:** Supabase PostgreSQL at `aws-1-ap-south-1.pooler.supabase.com`

```env
DATABASE_URL="postgresql://user:pass@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

### Schema Management

```bash
# View current schema
npx prisma studio

# Push changes (dev only)
npx prisma db push

# Generate Prisma client
npx prisma generate

# View migrations
npx prisma migrate status
```

### Key Tables

- **users** - User accounts & auth status
- **emailVerificationToken** - Magic link tokens
- **authSession** - Active sessions
- **onboardingProfile** - User onboarding data
- **careerAnalysis** - JR Score & career data

---

## Deployment

### Railway

**Production URL:** https://exoptus-server-production.up.railway.app

**To deploy:**

```bash
cd server
railway up
```

**Environment variables on Railway:**

- Same as local, but with production URLs
- No ngrok needed - Railway gives public HTTPS URL

### Google OAuth for Production

1. Register production URL in Google Cloud Console
2. Update GOOGLE_REDIRECT_URI to production URL
3. Remove test user restriction (publish OAuth app)

---

## Performance Optimizations

✅ **Email non-blocking** - API returns instantly, email sends in background
✅ **Database indexing** - Throttling queries are fast
✅ **Connection pooling** - Reuses database connections

---

## Contact & Support

For issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Check server logs: `npm run dev`
3. Check Expo logs: Look for red errors in terminal
