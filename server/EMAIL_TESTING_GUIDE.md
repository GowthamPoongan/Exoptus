# Email Magic Link Testing Guide

## ✅ Setup Complete

The backend now uses **nodemailer with SMTP** instead of Resend.

---

## 🔧 Configuration

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Create App Password**: https://myaccount.google.com/apppasswords
3. **Update `.env`**:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"  # App password from step 2
EMAIL_FROM="Exoptus <your-email@gmail.com>"
```

### Option 2: Outlook/Hotmail

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
EMAIL_FROM="Exoptus <your-email@outlook.com>"
```

### Option 3: Custom SMTP Server

```env
SMTP_HOST="mail.yourdomain.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="your-password"
EMAIL_FROM="Exoptus <noreply@yourdomain.com>"
```

---

## 🧪 Testing Endpoints

### 1. Start the server

```bash
cd server
npm run dev
```

Server should show:

```
🚀 EXOPTUS Server running on port 3000
```

---

### 2. Request Magic Link

**PowerShell:**

```powershell
$body = '{"email": "test@example.com"}'
Invoke-RestMethod -Uri "http://localhost:3000/auth/email/start" -Method POST -Body $body -ContentType "application/json"
```

**cURL:**

```bash
curl -X POST http://localhost:3000/auth/email/start \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Verification email sent",
  "email": "test@example.com"
}
```

---

### 3. Check Your Email

You'll receive an email with a magic link like:

```
http://localhost:3000/auth/email/verify?token=abc123...
```

Copy the **token** part (everything after `token=`)

---

### 4. Verify Token

**PowerShell:**

```powershell
$body = '{"token": "YOUR_TOKEN_HERE"}'
Invoke-RestMethod -Uri "http://localhost:3000/auth/email/verify" -Method POST -Body $body -ContentType "application/json"
```

**cURL:**

```bash
curl -X POST http://localhost:3000/auth/email/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'
```

**Expected Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "emailVerified": true
  }
}
```

---

### 5. Test Authenticated Endpoint

Use the JWT token from step 4:

**PowerShell:**

```powershell
$headers = @{ "Authorization" = "Bearer YOUR_JWT_TOKEN_HERE" }
Invoke-RestMethod -Uri "http://localhost:3000/auth/me" -Method GET -Headers $headers
```

**cURL:**

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "emailVerified": true
  }
}
```

---

## 🎯 Complete Flow Test Script

**PowerShell (Copy-paste this):**

```powershell
# Step 1: Request magic link
Write-Host "📧 Requesting magic link..." -ForegroundColor Cyan
$email = "test@example.com"
$body = "{`"email`": `"$email`"}"
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/email/start" -Method POST -Body $body -ContentType "application/json"
Write-Host "✅ Email sent to $email" -ForegroundColor Green

# Step 2: Wait for user to get token from email
Write-Host "`n🔑 Check your email and copy the token" -ForegroundColor Yellow
$token = Read-Host "Paste token here"

# Step 3: Verify token
Write-Host "`n🔐 Verifying token..." -ForegroundColor Cyan
$body = "{`"token`": `"$token`"}"
$authResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/email/verify" -Method POST -Body $body -ContentType "application/json"
$jwt = $authResponse.token
Write-Host "✅ JWT Token: $jwt" -ForegroundColor Green

# Step 4: Test authenticated endpoint
Write-Host "`n👤 Fetching user profile..." -ForegroundColor Cyan
$headers = @{ "Authorization" = "Bearer $jwt" }
$userResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/me" -Method GET -Headers $headers
Write-Host "✅ Logged in as: $($userResponse.user.email)" -ForegroundColor Green
$userResponse.user | ConvertTo-Json
```

---

## 🐛 Troubleshooting

### "Failed to send verification email"

**Check:**

- SMTP credentials are correct in `.env`
- Gmail: You're using App Password, not regular password
- Server logs show specific SMTP error

**Test SMTP connection:**

```powershell
cd server
node -e "const nodemailer = require('nodemailer'); require('dotenv').config(); const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }); transport.verify().then(() => console.log('✅ SMTP OK')).catch(err => console.error('❌ SMTP Error:', err.message));"
```

### "Invalid verification link"

- Token expired (10 minutes)
- Token already used
- Token format incorrect

### "Email not received"

- Check spam folder
- Verify SMTP credentials
- Try different email provider

---

## 🔒 Security Notes

✅ **Implemented:**

- Tokens are hashed before storing in database
- Tokens expire after 10 minutes
- Tokens are single-use (deleted after verification)
- Rate limiting prevents spam (60 seconds between requests)
- JWT tokens for session management

❌ **NOT stored in plain text:**

- Verification tokens (hashed with SHA-256)
- User passwords (if you add them later)

---

## 📱 Mobile App Integration

The mobile app should call:

1. **Sign In:** `POST /auth/email/start` with user's email
2. **Show message:** "Check your email for sign-in link"
3. **Deep link handler:** Capture `exoptus://(auth)/verifying?token=...`
4. **Verify:** `POST /auth/email/verify` with token
5. **Store JWT:** Save `response.token` in secure storage
6. **Use JWT:** Send `Authorization: Bearer {token}` header on all requests

---

## ✅ Production Checklist

Before deploying:

- [ ] Use production SMTP provider (not Gmail personal)
- [ ] Update `APP_BASE_URL` to production URL
- [ ] Use strong `JWT_SECRET` (generate: `openssl rand -hex 32`)
- [ ] Enable HTTPS for all endpoints
- [ ] Configure proper CORS settings
- [ ] Set up email monitoring/logging
- [ ] Test rate limiting is working
- [ ] Verify email templates render correctly

---

## 🎉 What Works Now

✅ Email magic link authentication  
✅ No domain verification required  
✅ Works with any SMTP provider  
✅ JWT session management  
✅ Secure token handling  
✅ Rate limiting  
✅ Works in localhost and production  
✅ Mobile-ready deep linking
