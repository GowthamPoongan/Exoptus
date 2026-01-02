# 🔒 Security Configuration Guide

## ⚠️ IMPORTANT: Before Deploying to Production

This guide explains how to properly configure sensitive credentials and remove hardcoded values.

---

## 1. Environment Variables Setup

### Server Configuration (`/server/.env`)

**Copy the example file:**
```bash
cd server
cp .env.example .env
```

**Required Configuration:**

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/exoptus"

# JWT Secret (generate a strong random string)
JWT_SECRET="your-unique-jwt-secret-min-32-chars"

# Admin Key (generate a strong random string)
ADMIN_KEY="your-unique-admin-key"

# Email SMTP (Gmail example)
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"  # Get from Google Account > App Passwords

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Server URLs (use your actual server IP or domain)
SERVER_URL="https://your-domain.com"
API_URL="https://your-domain.com"
```

### Admin Dashboard Configuration (`/apps/web-dashboard/.env`)

```bash
cd apps/web-dashboard
cp .env.example .env
```

```env
VITE_API_URL="https://your-api-domain.com"
VITE_ADMIN_KEY="same-as-server-admin-key"
```

### Mobile App Configuration (`/.env`)

```bash
cp .env.example .env
```

```env
# For local development on physical device, use your computer's local IP
# Find IP: ipconfig (Windows) or ifconfig (Mac/Linux)
EXPO_PUBLIC_API_URL="http://192.168.1.100:3000"
```

---

## 2. Remove Sensitive Data from Code

### ✅ Already Fixed:
- ❌ **Gmail credentials** → Now uses environment variables
- ❌ **Google OAuth secrets** → Now uses environment variables
- ❌ **Hardcoded IP addresses** → Now uses environment variables
- ❌ **Admin passwords** → Now uses environment variables

### 🔍 What Was Changed:

**Before:**
```typescript
const API_URL = "http://10.175.216.47:3000";  // ❌ Hardcoded IP
const adminPassword = "admin123";  // ❌ Exposed password
SMTP_USER="actual-email@gmail.com"  // ❌ Exposed in .env
```

**After:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";  // ✅
const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";  // ✅
SMTP_USER="your-email@example.com"  // ✅ In .env.example only
```

---

## 3. Generate Secure Secrets

### JWT Secret (Node.js)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Admin Key (PowerShell)
```powershell
[Convert]::ToBase64String([guid]::NewGuid().ToByteArray())
```

### Admin Password (Online)
Use: https://passwordsgenerator.net/ (min 16 chars)

---

## 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google` (development)
   - `https://your-domain.com/auth/google` (production)
4. Copy Client ID and Client Secret to `.env`

---

## 5. Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Go to **App Passwords**
4. Create new app password for "Mail"
5. Copy the 16-character password to `SMTP_PASS` in `.env`

---

## 6. Git Security Checklist

### ✅ Verify `.env` is NOT tracked:
```bash
git status
# Should NOT show server/.env or any .env files
```

### ✅ Files that ARE tracked (safe):
- `.env.example` (no real credentials)
- `README.md`
- All source code (no secrets)

### ❌ Files that should NEVER be committed:
- `.env` (real credentials)
- `*.pem` (SSL certificates)
- `*.key` (private keys)
- Database files with real data

---

## 7. Production Deployment Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (min 32 chars)
- [ ] Use HTTPS for all production URLs
- [ ] Enable firewall rules (only ports 80, 443)
- [ ] Set `NODE_ENV=production`
- [ ] Use PostgreSQL (not SQLite)
- [ ] Enable rate limiting
- [ ] Set up log monitoring
- [ ] Configure backup system
- [ ] Test admin authentication
- [ ] Verify OAuth redirect URLs
- [ ] Check CORS configuration

---

## 8. Network Configuration for Development

### Find Your Local IP:

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your network adapter
```

**Mac/Linux:**
```bash
ifconfig
# Look for "inet" under your network interface
```

### Update `.env` Files:

Replace `localhost` with your local IP for mobile device testing:

```env
# Example: Your IP is 192.168.1.100
API_URL="http://192.168.1.100:3000"
EXPO_DEV_URL="exp://192.168.1.100:8081"
```

---

## 9. Security Best Practices

### 🔐 Password Requirements:
- Admin password: Min 16 characters, mixed case, numbers, symbols
- JWT secret: Min 32 characters, random string
- Admin key: UUID or base64 encoded random bytes

### 🛡️ Access Control:
- Admin dashboard: Require admin key + session token
- API endpoints: JWT token validation
- OAuth: Validate state parameter

### 📝 Logging:
- Log all admin actions (already implemented in AdminLog table)
- Monitor failed login attempts
- Track API rate limits

### 🔄 Regular Maintenance:
- Rotate secrets every 90 days
- Update dependencies monthly
- Review audit logs weekly
- Backup database daily

---

## 10. Emergency Response

### If Credentials Are Exposed:

1. **Immediate Actions:**
   ```bash
   # Revoke OAuth credentials in Google Console
   # Change all passwords immediately
   # Rotate JWT secrets
   # Clear all sessions
   ```

2. **Clean Git History:**
   ```bash
   # Remove .env from git history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch server/.env" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (use with caution!)
   git push origin --force --all
   ```

3. **Notify Team:**
   - Send security alert
   - Document incident
   - Update credentials
   - Review access logs

---

## 📞 Support

If you discover a security vulnerability, please email: security@exoptus.com

**DO NOT** create a public GitHub issue for security vulnerabilities.

---

*Last Updated: January 2, 2026*
