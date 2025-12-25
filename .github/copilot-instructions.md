# EXOPTUS - AI-Driven Career Navigation App

## Project Overview

EXOPTUS is a stateful, conversational career navigation system built with React Native and Expo.

## Tech Stack

- **Framework**: React Native + Expo (SDK 52+)
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Animations**: Reanimated, Gesture Handler, Lottie
- **State Management**: Zustand
- **Backend**: Node.js + Express (separate server folder)
- **Database**: PostgreSQL with Prisma ORM

## Project Structure

```
/app
 ├─ /(auth)          # Authentication screens
 ├─ /(onboarding)    # Onboarding chat flow
 ├─ /(main)          # Main app screens
/components          # Reusable UI components
/services            # API and utility services
/store               # Zustand state stores
/assets              # Images, fonts, Lottie files
```

## Design Principles

- No long forms - conversational UI
- No dead screens - always guide the user
- Smooth, meaningful animations
- Trust > Speed
- Premium, calm UX

## Coding Guidelines

- Use TypeScript for type safety
- Use NativeWind classes for styling
- Keep components small and focused
- Add comments explaining UX intent
- Follow accessibility best practices

## Animation Guidelines

- Use Reanimated for gesture-based animations
- Use Lottie for complex logo/icon animations
- Animations should explain state changes
- Smooth transitions between screens
