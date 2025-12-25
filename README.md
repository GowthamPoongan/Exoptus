# EXOPTUS

> AI-Driven Career Navigation Platform

[![CI](https://github.com/exoptus/exoptus/actions/workflows/ci.yml/badge.svg)](https://github.com/exoptus/exoptus/actions/workflows/ci.yml)
[![CodeRabbit](https://img.shields.io/badge/CodeRabbit-AI%20Review-blue)](https://coderabbit.ai)

## Overview

EXOPTUS is a stateful, conversational career navigation system that helps users discover their ideal career path through AI-guided interactions with **Odyssey**, our AI career assistant.

### Key Features

- 🤖 **Conversational Onboarding** - No forms, just natural conversation
- 📊 **Job Readiness Score** - AI-powered career assessment
- 🗺️ **Career Roadmaps** - Personalized learning paths
- 📄 **Resume Analysis** - Intelligent resume parsing and feedback
- 🎯 **Job Matching** - Recommendations based on your profile

## Tech Stack

| Layer    | Technology                 |
| -------- | -------------------------- |
| Mobile   | React Native + Expo SDK 54 |
| Styling  | NativeWind (TailwindCSS)   |
| State    | Zustand                    |
| Backend  | Express.js + Prisma        |
| Database | PostgreSQL                 |
| Auth     | JWT + Google OAuth         |

## Monorepo Structure

```
exoptus/
├── apps/
│   └── mobile/                 # React Native + Expo app
├── services/
│   └── auth-service/           # Authentication backend
├── packages/
│   ├── api-contracts/          # Shared API schemas (Zod)
│   ├── ui-design-system/       # Design tokens & components
│   ├── utils/                  # Shared utilities
│   └── feature-flags/          # Feature flag system
├── infra/                      # Infrastructure configs
├── tools/                      # Development tools
└── docs/                       # Documentation
```

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL (for auth service)
- Expo Go app (for mobile testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/exoptus/exoptus.git
cd exoptus

# Install dependencies
npm install

# Setup environment files
cp apps/mobile/.env.example apps/mobile/.env
cp services/auth-service/.env.example services/auth-service/.env

# Setup database
npm run db:push -w @exoptus/auth-service

# Start development
npm run dev
```

### Available Scripts

| Command              | Description             |
| -------------------- | ----------------------- |
| `npm run dev`        | Start all services      |
| `npm run dev:mobile` | Start mobile app only   |
| `npm run dev:auth`   | Start auth service only |
| `npm run build`      | Build all packages      |
| `npm run lint`       | Lint all packages       |
| `npm run test`       | Run all tests           |
| `npm run db:studio`  | Open Prisma Studio      |

## Documentation

- [Architecture Overview](docs/architecture/OVERVIEW.md)
- [Getting Started Guide](docs/onboarding/GETTING_STARTED.md)
- [Architecture Decisions](docs/decisions/)

## Contributing

We use trunk-based development with short-lived feature branches.

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Push and create a PR: `git push -u origin feature/your-feature`
4. CodeRabbit will automatically review your PR

### Commit Convention

```
feat(mobile): add new dashboard widget
fix(auth): resolve token refresh issue
docs: update API documentation
chore: upgrade dependencies
```

## License

Private - All Rights Reserved

---

Built with ❤️ by the EXOPTUS Team
