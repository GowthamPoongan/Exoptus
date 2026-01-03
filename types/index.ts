// Global type definitions for EXOPTUS app

// Navigation types
export type AuthStackParamList = {
  welcome: undefined;
  "signup-email": undefined;
  "email-verification": { email: string };
  verifying: { token?: string };
};

export type OnboardingStackParamList = {
  chat: undefined;
  "evaluation-progress": undefined;
  "analysis-complete": undefined;
  "analysis-results": undefined;
  "intro-carousel": undefined;
};

export type MainStackParamList = {
  home: undefined;
  explore: undefined;
  roadmap: undefined;
  resume: undefined;
  profile: undefined;
};

// ============================================
// AUTH TYPES
// ============================================

// Auth provider enum (matches backend)
export type AuthProvider = "email" | "google";

// Onboarding status enum (matches backend)
export type OnboardingStatus = "not_started" | "in_progress" | "completed";

// User types (aligned with backend Prisma schema)
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;

  // Multi-provider auth support (matches Prisma - comma-separated string in DB, but exposed as string or parsed)
  authProviders?: string; // Comma-separated: "email,google" (matches Prisma String type)
  createdWith?: AuthProvider;
  googleId?: string | null;

  // Enhanced onboarding tracking
  onboardingCompleted: boolean;
  onboardingStep?: string | null;
  lastCompletedStep?: string | null;

  // Legacy field (for backward compatibility with existing code)
  onboardingStatus: OnboardingStatus;

  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;

  // JR Score
  jrScore?: number | null;
}

// Auth response from backend
export interface AuthResponse {
  token: string;
  user: User;
}

// Onboarding types
export interface OnboardingQuestion {
  id: string;
  type: "single" | "multi" | "input" | "chips";
  question: string;
  options?: string[];
  nextQuestionMap?: Record<string, string>;
}

export interface OnboardingAnswer {
  questionId: string;
  answer: string | string[];
  timestamp: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  type: "user" | "system";
  content: string;
  timestamp: string;
  options?: string[];
  inputType?: "text" | "chips" | "cards";
}

// Analysis types
export interface SkillAnalysis {
  name: string;
  userLevel: number;
  industryAvg: number;
}

export interface GrowthProjection {
  month: number;
  readiness: number;
}

export interface CareerAnalysis {
  skills: SkillAnalysis[];
  growthProjection: GrowthProjection[];
  strengths: string[];
  focusAreas: string[];
  readinessTimeline: string;
  generatedAt: string;
}
