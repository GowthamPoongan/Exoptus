# ADR-002: Authentication Strategy

## Status

**Accepted** - December 2024

## Context

EXOPTUS needs a secure authentication system that:

- Supports email/password login
- Supports Google OAuth
- Works seamlessly on mobile (React Native)
- Provides secure session management
- Enables account linking between providers

## Decision

We will use **JWT-based authentication** with the following design:

### Token Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Token Architecture                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Access Token (Short-lived: 15 minutes)                     │
│  ├── Stored in memory                                       │
│  ├── Sent via Authorization header                          │
│  └── Contains: userId, email, iat, exp                      │
│                                                              │
│  Refresh Token (Long-lived: 7 days)                         │
│  ├── Stored in AsyncStorage (encrypted)                     │
│  ├── Used to obtain new access tokens                       │
│  └── Rotated on each refresh                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flows

#### Email/Password

1. User enters email + password
2. Server validates credentials against bcrypt hash
3. Server returns access + refresh tokens
4. Email verification required for sensitive actions

#### Google OAuth

1. Mobile app initiates Google Sign-In
2. Google returns ID token
3. Server validates ID token with Google
4. Server creates/finds user and returns JWT tokens

### Account Linking

- Users can link multiple auth providers to one account
- Primary identifier is email address
- `UserAuthProvider` table stores provider-specific data

## Consequences

### Positive

- Stateless authentication (scalable)
- Works well with React Native
- Supports offline token refresh
- Secure with short-lived access tokens

### Negative

- Cannot revoke tokens immediately
- More complex than session cookies
- Need to handle token refresh logic

### Security Measures

- Passwords hashed with bcrypt (12 rounds)
- HTTPS only in production
- Rate limiting on auth endpoints
- Device fingerprinting for suspicious activity

## Implementation

- Auth service: `services/auth-service/`
- Mobile auth logic: `apps/mobile/services/auth.ts`
- Token storage: AsyncStorage with expo-secure-store (future)

## References

- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Authentication Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
