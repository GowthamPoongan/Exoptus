/**
 * JR Score Types - Strict Contract for Gemini AI Integration
 *
 * This defines the EXACT shape Gemini must return.
 * Server validates against this contract - no exceptions.
 */

// ============================================================================
// JR SCORE CONTRACT (NON-NEGOTIABLE)
// ============================================================================

/**
 * The exact shape Gemini MUST return
 * If any field is missing or wrong type → fallback kicks in
 */
export interface GeminiJRScoreResponse {
  /** Overall JR score (0-100) */
  jr_score: number;

  /** Confidence sub-score (0-25) - How certain they are about career path */
  confidence: number;

  /** Clarity sub-score (0-25) - How clear their goals and communication */
  clarity: number;

  /** Consistency sub-score (0-25) - How aligned their skills/experience with goals */
  consistency: number;

  /** Execution readiness sub-score (0-25) - How ready to take action */
  execution_readiness: number;

  /** Risk flags indicating potential issues */
  risk_flags: string[];

  /** AI reasoning for the score (for logging/debugging) */
  reasoning: string;
}

/**
 * Extended JR Score with metadata for storage
 */
export interface JRScoreResult extends GeminiJRScoreResponse {
  /** Whether this score came from AI or fallback */
  source: "gemini" | "fallback" | "cached";

  /** ISO timestamp when score was generated */
  generated_at: string;

  /** Processing time in ms (for monitoring) */
  processing_time_ms?: number;
}

/**
 * Chat history format for Gemini input
 */
export interface OnboardingChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  step_id?: string;
}

/**
 * User data context for scoring
 */
export interface UserScoringContext {
  name: string;
  status: "Student" | "Graduate" | "Working";
  age?: number;
  gender?: string;
  state?: string;
  city?: string;
  college?: string;
  course?: string;
  stream?: string;
  semester?: number;
  passoutYear?: number;
  cgpa?: number;
  subjects?: string[];
  careerAspiration?: string;
  selectedRoleName?: string;
  resumeUrl?: string;
}

/**
 * Full scoring request payload
 */
export interface JRScoreRequest {
  userId: string;
  userContext: UserScoringContext;
  chatHistory?: OnboardingChatMessage[];
  forceRecalculate?: boolean;
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const JR_SCORE_LIMITS = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  MAX_SUB_SCORE: 25,
  MIN_SUB_SCORE: 0,
} as const;

export const FALLBACK_SCORE: GeminiJRScoreResponse = {
  jr_score: 42,
  confidence: 10,
  clarity: 10,
  consistency: 12,
  execution_readiness: 10,
  risk_flags: ["ai_fallback"],
  reasoning: "Fallback score due to AI unavailability or invalid response",
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to validate Gemini response shape
 */
export function isValidGeminiResponse(
  data: unknown
): data is GeminiJRScoreResponse {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  // Check required number fields
  const numberFields = [
    "jr_score",
    "confidence",
    "clarity",
    "consistency",
    "execution_readiness",
  ];
  for (const field of numberFields) {
    if (typeof obj[field] !== "number") return false;
  }

  // Check array field
  if (!Array.isArray(obj.risk_flags)) return false;

  // Check string field
  if (typeof obj.reasoning !== "string") return false;

  return true;
}

/**
 * Validate score is within bounds
 */
export function isScoreInBounds(score: number): boolean {
  return (
    score >= JR_SCORE_LIMITS.MIN_SCORE && score <= JR_SCORE_LIMITS.MAX_SCORE
  );
}

/**
 * Validate sub-score is within bounds
 */
export function isSubScoreInBounds(score: number): boolean {
  return (
    score >= JR_SCORE_LIMITS.MIN_SUB_SCORE &&
    score <= JR_SCORE_LIMITS.MAX_SUB_SCORE
  );
}
