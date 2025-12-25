# EXOPTUS Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EXOPTUS Platform                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   Mobile App    │  │  Web Dashboard  │  │   Admin Portal  │          │
│  │  (React Native) │  │   (Next.js)     │  │   (Next.js)     │          │
│  │   Expo SDK 54   │  │   [Future]      │  │   [Future]      │          │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
│           │                    │                    │                    │
│           └────────────────────┼────────────────────┘                    │
│                                │                                         │
│                                ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        API Gateway (Future)                      │    │
│  │                    Kong / AWS API Gateway                        │    │
│  └───────────────────────────────┬─────────────────────────────────┘    │
│                                  │                                       │
│           ┌──────────────────────┼──────────────────────┐               │
│           │                      │                      │               │
│           ▼                      ▼                      ▼               │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐        │
│  │  Auth Service  │    │   AI Engine    │    │  User Profile  │        │
│  │   (Express)    │    │   (Odyssey)    │    │    Service     │        │
│  │   PostgreSQL   │    │   [Future]     │    │   [Future]     │        │
│  └────────────────┘    └────────────────┘    └────────────────┘        │
│                                                                          │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐        │
│  │ Recommendation │    │  Notification  │    │   Analytics    │        │
│  │    Service     │    │    Service     │    │    Service     │        │
│  │   [Future]     │    │   [Future]     │    │   [Future]     │        │
│  └────────────────┘    └────────────────┘    └────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
exoptus/
├── apps/                          # Frontend applications
│   ├── mobile/                    # React Native + Expo mobile app
│   └── web-dashboard/             # Admin dashboard (future)
│
├── services/                      # Backend microservices
│   ├── auth-service/              # Authentication & authorization
│   ├── user-profile-service/      # User data management (future)
│   ├── ai-engine/                 # Odyssey AI processing (future)
│   ├── recommendation-service/    # Job recommendations (future)
│   └── notification-service/      # Push & email notifications (future)
│
├── packages/                      # Shared libraries
│   ├── ui-design-system/          # Shared UI components & tokens
│   ├── api-contracts/             # Zod schemas & API types
│   ├── utils/                     # Common utility functions
│   └── feature-flags/             # Feature flag management
│
├── infra/                         # Infrastructure configuration
│   ├── ci-cd/                     # Pipeline configurations
│   ├── terraform/                 # Infrastructure as Code
│   ├── kubernetes/                # K8s manifests
│   └── docker/                    # Docker configurations
│
├── tools/                         # Development tools
│   ├── scripts/                   # Build & deploy scripts
│   ├── codegen/                   # Code generation tools
│   └── refactors/                 # Codemod scripts
│
└── docs/                          # Documentation
    ├── architecture/              # Architecture decisions
    ├── decisions/                 # ADRs (Architecture Decision Records)
    └── onboarding/                # Developer onboarding guides
```

## Design Principles

### 1. Mobile-First

- Primary platform is mobile (React Native + Expo)
- Web platforms share components through design system
- Offline-first architecture for mobile reliability

### 2. Conversational UX

- No traditional forms - chat-based interactions
- Odyssey AI guides users through onboarding
- Trust-building through progressive disclosure

### 3. Microservices-Ready

- Services designed for independent deployment
- API contracts ensure backward compatibility
- Feature flags enable gradual rollouts

### 4. Security-First

- JWT-based authentication with refresh tokens
- Google OAuth for social login
- Email verification required for sensitive actions

## Technology Stack

### Frontend

| Component        | Technology               |
| ---------------- | ------------------------ |
| Mobile Framework | React Native 0.81        |
| Build System     | Expo SDK 54              |
| Styling          | NativeWind (TailwindCSS) |
| State Management | Zustand                  |
| Animations       | Reanimated, Lottie       |
| Navigation       | Expo Router              |

### Backend

| Component      | Technology   |
| -------------- | ------------ |
| Runtime        | Node.js 20+  |
| Framework      | Express.js   |
| Database       | PostgreSQL   |
| ORM            | Prisma       |
| Authentication | JWT + bcrypt |
| Validation     | Zod          |

### Infrastructure

| Component     | Technology          |
| ------------- | ------------------- |
| CI/CD         | GitHub Actions      |
| Mobile Builds | EAS Build           |
| Container     | Docker              |
| Orchestration | Kubernetes (future) |
| IaC           | Terraform (future)  |

## Data Flow

### Authentication Flow

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│  Mobile  │───▶│ Auth Service │───▶│  PostgreSQL  │
│   App    │◀───│   (JWT)      │◀───│  (Users DB)  │
└──────────┘    └──────────────┘    └──────────────┘
     │                                     │
     │         ┌──────────────┐            │
     └────────▶│   Google     │────────────┘
               │   OAuth      │
               └──────────────┘
```

### Onboarding Flow

```
User ──▶ Welcome ──▶ Carousel ──▶ Chat (Odyssey AI) ──▶ Analysis ──▶ Dashboard
                                       │
                                       ▼
                               Resume Upload (Optional)
```

## Shared Packages

### @exoptus/api-contracts

- Zod schemas for request/response validation
- TypeScript types for API communication
- Ensures type safety across frontend/backend

### @exoptus/ui-design-system

- Design tokens (colors, spacing, typography)
- Shared React Native components
- Animation presets

### @exoptus/utils

- Common utility functions
- Date/string formatting
- Validation helpers

### @exoptus/feature-flags

- Feature flag management
- A/B testing support
- Environment-based configuration
