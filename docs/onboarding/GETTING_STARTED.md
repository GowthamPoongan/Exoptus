# EXOPTUS Developer Onboarding Guide

Welcome to EXOPTUS! This guide will help you get up and running quickly.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Project Structure](#project-structure)
4. [Running the App](#running-the-app)
5. [Development Workflow](#development-workflow)
6. [Code Standards](#code-standards)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** v20.0.0 or higher
- **npm** v10.0.0 or higher
- **Git** v2.30 or higher
- **VS Code** (recommended)

### Mobile Development

- **Expo Go** app on your phone (for quick testing)
- **Android Studio** (for Android builds)
- **Xcode** (for iOS builds, macOS only)

### VS Code Extensions

- ESLint
- Prettier
- GitLens
- React Native Tools
- Tailwind CSS IntelliSense

---

## Repository Setup

### 1. Clone the Repository

```bash
git clone https://github.com/exoptus/exoptus.git
cd exoptus
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces:

- `apps/mobile` - Mobile app
- `services/auth-service` - Auth backend
- `packages/*` - Shared packages

### 3. Environment Setup

#### Mobile App

```bash
# Copy environment template
cp apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id
```

#### Auth Service

```bash
# Copy environment template
cp services/auth-service/.env.example services/auth-service/.env
```

Edit `services/auth-service/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/exoptus"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate -w @exoptus/auth-service

# Push schema to database
npm run db:push -w @exoptus/auth-service
```

---

## Project Structure

```
exoptus/
├── apps/
│   └── mobile/              # React Native + Expo app
│       ├── app/             # Expo Router screens
│       ├── components/      # UI components
│       ├── services/        # API services
│       ├── store/           # Zustand stores
│       └── assets/          # Images, fonts, videos
│
├── services/
│   └── auth-service/        # Express.js auth backend
│       ├── src/
│       │   ├── routes/      # API routes
│       │   └── lib/         # Utilities
│       └── prisma/          # Database schema
│
├── packages/
│   ├── api-contracts/       # Shared API types
│   ├── ui-design-system/    # Design tokens
│   ├── utils/               # Utility functions
│   └── feature-flags/       # Feature flags
│
└── docs/                    # Documentation
```

---

## Running the App

### Full Development Stack

```bash
npm run dev
```

This starts:

- Mobile app on Expo (port 8081)
- Auth service (port 3000)

### Individual Services

```bash
# Mobile app only
npm run dev:mobile

# Auth service only
npm run dev:auth
```

### Mobile App on Device

1. Start the dev server: `npm run dev:mobile`
2. Open Expo Go on your phone
3. Scan the QR code

### Mobile App on Emulator

```bash
# Android
npm run android -w @exoptus/mobile

# iOS (macOS only)
npm run ios -w @exoptus/mobile
```

---

## Development Workflow

### Trunk-Based Development

We use trunk-based development with short-lived feature branches.

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ...

# Push and create PR
git push -u origin feature/your-feature-name
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(mobile): add JR score card to dashboard
fix(auth): resolve token refresh race condition
docs: update onboarding guide
chore: upgrade expo to 54.0.30
```

### PR Guidelines

1. Keep PRs small and focused
2. Include screenshots for UI changes
3. Link related issues
4. Request review from code owners

---

## Code Standards

### TypeScript

- Strict mode enabled
- No `any` unless absolutely necessary
- Document complex types

### React Native

- Functional components only
- Use NativeWind for styling
- Prefer composition over inheritance

### Styling (NativeWind)

```tsx
// ✅ Good
<View className="flex-1 bg-neutral-950 p-4">

// ❌ Avoid inline styles
<View style={{ flex: 1, backgroundColor: '#0a0a0b' }}>
```

### State Management

- Zustand for global state
- React state for local UI state
- No Redux

---

## Common Tasks

### Add a New Screen

1. Create file in `apps/mobile/app/(main)/`
2. Export default React component
3. Expo Router auto-registers the route

### Add a New API Endpoint

1. Add route in `services/auth-service/src/routes/`
2. Add Zod schema in `packages/api-contracts/`
3. Update mobile API service

### Add a New Component

1. Create in `apps/mobile/components/`
2. Export from `components/index.ts`
3. Document props with TypeScript

### Run Database Migrations

```bash
npm run db:migrate -w @exoptus/auth-service
```

### Open Database GUI

```bash
npm run db:studio -w @exoptus/auth-service
```

---

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear cache
cd apps/mobile
npx expo start -c
```

### Prisma Issues

```bash
# Regenerate client
cd services/auth-service
npx prisma generate
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules
rm package-lock.json
npm install
```

### Port Already in Use

```bash
# Find process
lsof -i :3000
# Kill it
kill -9 <PID>
```

---

## Getting Help

- **Slack**: #exoptus-dev
- **Documentation**: `/docs`
- **Architecture Questions**: See ADRs in `/docs/decisions`

Welcome aboard! 🚀
