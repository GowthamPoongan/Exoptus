/**
 * @exoptus/api-contracts
 *
 * Shared API schemas and types for EXOPTUS services
 * Uses Zod for runtime validation
 */

import { z } from "zod";

// ============================================
// User Schemas
// ============================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  profileImage: z.string().url().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// ============================================
// Auth Schemas
// ============================================

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const GoogleAuthRequestSchema = z.object({
  idToken: z.string(),
});

export const AuthResponseSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type GoogleAuthRequest = z.infer<typeof GoogleAuthRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ============================================
// Onboarding Schemas
// ============================================

export const OnboardingStepSchema = z.enum([
  "career_goals",
  "experience_level",
  "skills_assessment",
  "preferences",
  "resume_upload",
  "analysis",
  "completed",
]);

export const OnboardingDataSchema = z.object({
  currentStep: OnboardingStepSchema,
  careerGoals: z.array(z.string()).optional(),
  experienceLevel: z.string().optional(),
  skills: z.array(z.string()).optional(),
  preferences: z.record(z.unknown()).optional(),
  resumeData: z.record(z.unknown()).optional(),
});

export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;
export type OnboardingData = z.infer<typeof OnboardingDataSchema>;

// ============================================
// API Response Wrappers
// ============================================

export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================
// JR Score Schemas
// ============================================

export const JRScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  skills: z.number().min(0).max(100),
  experience: z.number().min(0).max(100),
  education: z.number().min(0).max(100),
  presentation: z.number().min(0).max(100),
});

export type JRScore = z.infer<typeof JRScoreSchema>;
