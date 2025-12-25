# ADR-003: Conversational Onboarding Design

## Status

**Accepted** - December 2024

## Context

Traditional career apps use long forms that:

- Feel tedious and impersonal
- Have high drop-off rates
- Don't build trust with users
- Collect data without context

EXOPTUS aims to differentiate through a **conversational, AI-guided experience**.

## Decision

We will implement a **chat-based onboarding** with Odyssey AI that:

### Design Principles

1. **No forms, just conversation** - All data collected through natural dialogue
2. **Progressive disclosure** - Only ask what's needed at each step
3. **Explain the why** - Tell users how their data improves recommendations
4. **Visual feedback** - Animations and progress indicators
5. **Skip-friendly** - Users can skip sections and return later

### Onboarding Flow

```
Welcome → Carousel → Chat → Analysis → Dashboard
           (3 videos)  │
                       ├── Career Goals
                       ├── Experience Level
                       ├── Skills Assessment
                       ├── Preferences
                       └── Resume Upload (Optional)
```

### Odyssey AI Personality

- **Warm and encouraging** - Not robotic
- **Curious** - Asks follow-up questions
- **Knowledgeable** - Provides relevant insights
- **Respectful** - Never pushes too hard

### Chat Message Types

```typescript
type MessageType =
  | "odyssey" // AI message
  | "user" // User response
  | "system" // System notification
  | "quick_reply" // Predefined options
  | "input" // Free-form input
  | "file" // File upload (resume)
  | "progress"; // Progress indicator
```

## Consequences

### Positive

- Higher engagement and completion rates
- More accurate data through context
- Builds trust and relationship
- Differentiates from competitors
- Enables personalized experience

### Negative

- More complex to implement
- Requires careful UX writing
- Harder to A/B test individual fields
- Longer development time

### Implementation Details

- Chat state managed by Zustand (`onboardingStore`)
- Messages rendered with animation delays
- Typing indicators for AI responses
- Persistent progress saved to backend

## References

- [Conversational UI Patterns](https://www.nngroup.com/articles/chatbots/)
- [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
