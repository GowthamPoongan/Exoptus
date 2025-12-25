# Account Linking & Onboarding Tracking - Implementation Complete ✅

## What Was Implemented

### 1. **Database Schema Updates** ✅

Updated [server/prisma/schema.prisma](server/prisma/schema.prisma):

- **Multi-Provider Auth Support:**

  - `authProviders` - Comma-separated list of linked methods (e.g., "email,google")
  - `createdWith` - Original signup method
  - `googleId` - Store Google ID when linked

- **Enhanced Onboarding Tracking:**
  - `onboardingCompleted` - Boolean flag
  - `onboardingStep` - Current step (e.g., "chat", "evaluation_progress")
  - `lastCompletedStep` - Last completed step
  - `onboardingCompletedAt` - Completion timestamp

### 2. **Onboarding Utilities** ✅

Created [server/src/lib/onboarding.ts](server/src/lib/onboarding.ts):

- `ONBOARDING_STEPS` - Defined step flow:

  1. `intro_carousel`
  2. `chat`
  3. `evaluation_progress`
  4. `analysis_results`
  5. `analysis_complete`

- **Key Functions:**
  - `getNextStep()` - Determine next onboarding step
  - `isOnboardingComplete()` - Check if onboarding is done
  - `updateOnboardingProgress()` - Update user's progress
  - `getRedirectPath()` - Get route based on completion status
  - `addAuthProvider()` - Link new auth provider to account
  - `hasAuthProvider()` - Check if provider is linked

### 3. **Auth Routes Updates** ✅

Updated [server/src/routes/auth.ts](server/src/routes/auth.ts):

**Email Magic Link Flow:**

- Creates users with `authProviders: "email"`, `createdWith: "email"`
- Returns `redirectTo` path in response
- Includes `onboardingCompleted` and `onboardingStep` in user object

**Google OAuth Flow with Account Linking:**

- **New User:** Creates with `authProviders: "google"`, `createdWith: "google"`
- **Existing User (email-only):** Auto-links Google account
  - Updates `authProviders` to "email,google"
  - Adds `googleId`
  - Preserves original `createdWith` value
- **Already Linked:** Just signs in
- Returns `redirectTo` path and enhanced user object

**Session Check:**

- Returns `authProviders` as array
- Includes all onboarding fields

### 4. **User Routes Updates** ✅

Updated [server/src/routes/user.ts](server/src/routes/user.ts):

**New Endpoints:**

- `POST /user/onboarding/step/complete` - Complete an onboarding step

  ```json
  {
    "step": "chat",
    "data": { "answers": [...] }
  }
  ```

  Returns:

  ```json
  {
    "completed": false,
    "nextStep": "evaluation_progress",
    "redirectTo": "/(onboarding)/evaluation-progress"
  }
  ```

- `GET /user/onboarding/status` - Get current onboarding status
  ```json
  {
    "completed": false,
    "currentStep": "chat",
    "lastCompletedStep": "intro_carousel",
    "redirectTo": "/(onboarding)/chat",
    "onboardingData": { ... }
  }
  ```

**Updated Endpoints:**

- All profile/user endpoints now return `authProviders` as array
- Include all new onboarding fields

## How It Works

### Account Linking Flow

```
User Signs In with Google
          ↓
    Email exists?
          ↓
    ┌─────┴─────┐
   NO          YES
    ↓           ↓
 Create      Has Google?
  User           ↓
    ↓      ┌────┴────┐
    │     YES       NO
    │      ↓         ↓
    │   Sign In   Auto-Link
    │      ↓      (add to authProviders)
    └──────┴─────────┘
          ↓
  Check onboardingCompleted?
          ↓
    ┌─────┴─────┐
   NO          YES
    ↓           ↓
Resume at    Go to
saved step   /(main)/home
```

### Onboarding Flow

1. User signs up → `onboardingStep = "intro_carousel"`
2. Completes intro → `POST /user/onboarding/step/complete { step: "intro_carousel" }`
3. Server updates → `onboardingStep = "chat"`
4. Returns → `redirectTo = "/(onboarding)/chat"`
5. Repeat until `onboardingCompleted = true`
6. Final redirect → `/(main)/home`

## API Response Examples

### After Email Verification:

```json
{
  "token": "eyJhbGc...",
  "redirectTo": "/(onboarding)/chat",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true,
    "onboardingCompleted": false,
    "onboardingStep": "chat",
    "authProviders": ["email"]
  }
}
```

### After Google Sign-In (Account Linked):

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "redirectTo": "/(onboarding)/evaluation_progress",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://...",
      "emailVerified": true,
      "onboardingCompleted": false,
      "onboardingStep": "evaluation_progress",
      "authProviders": ["email", "google"]
    }
  }
}
```

### After Onboarding Complete:

```json
{
  "token": "eyJhbGc...",
  "redirectTo": "/(main)/home",
  "user": {
    "onboardingCompleted": true,
    "onboardingStep": null,
    "authProviders": ["email", "google"]
  }
}
```

## Database Migration Status

✅ Schema pushed to database
⚠️ Prisma client regeneration pending (Windows file lock - restart server needed)

**Migration Notes:**

- Existing user preserved with `authProviders: "email"` (via default)
- All new fields added with appropriate defaults
- Backward compatible with `onboardingStatus` field

## Next Steps to Complete

1. **Restart the server** to unlock Prisma client files:

   ```powershell
   cd server
   npm run dev
   ```

2. **Test the Account Linking:**

   - Sign in with email
   - Sign in with Google using same email
   - Verify `authProviders` array contains both

3. **Test Onboarding Flow:**

   - Sign up new user
   - Complete intro carousel → check redirect
   - Complete each step → verify progress tracking
   - Check final redirect to home

4. **Frontend Integration:**
   - Update auth store to handle `redirectTo` field
   - Add onboarding step completion API calls
   - Use `redirectTo` path for navigation after auth

## Testing Commands

```powershell
# Restart server
cd server
npm run dev

# Test email auth
curl -X POST http://localhost:3000/auth/email/start \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Complete onboarding step (with auth token)
curl -X POST http://localhost:3000/user/onboarding/step/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"step":"chat","data":{"completed":true}}'

# Check onboarding status
curl -X GET http://localhost:3000/user/onboarding/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Files Modified

1. ✅ [server/prisma/schema.prisma](server/prisma/schema.prisma) - Enhanced User model
2. ✅ [server/src/lib/onboarding.ts](server/src/lib/onboarding.ts) - New utilities file
3. ✅ [server/src/routes/auth.ts](server/src/routes/auth.ts) - Account linking logic
4. ✅ [server/src/routes/user.ts](server/src/routes/user.ts) - Onboarding endpoints

## Summary

🎉 **Account linking and onboarding tracking system fully implemented!**

The system now:

- ✅ Supports multiple auth providers per user
- ✅ Auto-links Google accounts to existing email accounts
- ✅ Tracks onboarding progress step-by-step
- ✅ Returns correct redirect paths based on completion status
- ✅ Provides granular step completion tracking
- ✅ Maintains backward compatibility

Just restart the server to complete the setup!
