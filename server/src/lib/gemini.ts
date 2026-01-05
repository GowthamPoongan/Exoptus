/**
 * EXOPTUS - Gemini AI Service
 *
 * Production-grade JR Score calculation with Gemini AI.
 *
 * Architecture: "Gemini may calculate, but system never trusts blindly"
 * - Dual-layer scoring: Gemini (primary) + Server Guard (validator)
 * - Full try/catch shock absorber
 * - Fallback guarantees frontend never sees failure
 *
 * @module lib/gemini
 */

import {
  GeminiJRScoreResponse,
  JRScoreResult,
  UserScoringContext,
  OnboardingChatMessage,
  FALLBACK_SCORE,
  JR_SCORE_LIMITS,
  isValidGeminiResponse,
  isScoreInBounds,
  isSubScoreInBounds,
} from "../types/jr-score";

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// Using Gemini 2.0 Flash (latest, fastest model)
// Alternative models: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash
const GEMINI_MODEL = "gemini-2.0-flash-exp";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Timeout for Gemini API calls (ms)
const GEMINI_TIMEOUT_MS = 15000;

// ============================================================================
// PRODUCTION GEMINI PROMPT (STRICT, SAFE, JSON-ONLY)
// ============================================================================

const JR_SCORE_SYSTEM_PROMPT = `You are an evaluation engine for career readiness assessment.

Task:
Calculate a JR Score (Job Readiness Score, 0–100) for a user based on their onboarding profile data.

CRITICAL RULES:
- Output MUST be valid JSON only
- Do NOT include markdown, code fences, comments, or explanations outside JSON
- Do NOT invent or hallucinate data
- If data is insufficient, lower the score accordingly
- Be conservative, not optimistic
- Scores must be realistic and grounded

Scoring dimensions (each 0-25 points):
- confidence: How certain they are about their career path and goals
- clarity: How clear and articulate their goals and communication
- consistency: How aligned their skills, experience, and education with stated goals
- execution_readiness: How prepared they are to take immediate action toward goals

Risk flags to consider:
- "unclear_goals" - Career aspiration is vague
- "skill_mismatch" - Skills don't align with career goals
- "low_experience" - Very limited practical experience
- "education_gap" - Education doesn't support career path
- "location_challenge" - Location may limit opportunities
- "timeline_unrealistic" - Expectations don't match current readiness

Output JSON schema (respond with ONLY this JSON, no other text):
{
  "jr_score": <number 0-100>,
  "confidence": <number 0-25>,
  "clarity": <number 0-25>,
  "consistency": <number 0-25>,
  "execution_readiness": <number 0-25>,
  "risk_flags": [<array of relevant risk flag strings>],
  "reasoning": "<brief 1-2 sentence explanation of the score>"
}`;

// ============================================================================
// CORE GEMINI API CALL
// ============================================================================

/**
 * Raw call to Gemini API with timeout handling
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Low temperature for deterministic output
          topK: 1,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as any;

    // Extract text from Gemini response structure
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Empty response from Gemini");
    }

    return content;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error(`Gemini API timeout after ${GEMINI_TIMEOUT_MS}ms`);
    }
    throw error;
  }
}

// ============================================================================
// VALIDATION LAYER (ANTI-HALLUCINATION)
// ============================================================================

/**
 * Validate Gemini response structure and values
 * Returns null if invalid, otherwise returns validated data
 */
function validateGeminiResponse(rawText: string): GeminiJRScoreResponse | null {
  try {
    // Strip any markdown code fences if Gemini added them
    let cleanText = rawText.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.slice(7);
    }
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.slice(3);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();

    const parsed = JSON.parse(cleanText);

    // Type guard validation
    if (!isValidGeminiResponse(parsed)) {
      console.error("❌ Gemini response failed type validation:", parsed);
      return null;
    }

    // Score bounds validation
    if (!isScoreInBounds(parsed.jr_score)) {
      console.error(`❌ JR score out of bounds: ${parsed.jr_score}`);
      return null;
    }

    // Sub-score bounds validation
    const subScores = [
      "confidence",
      "clarity",
      "consistency",
      "execution_readiness",
    ] as const;
    for (const field of subScores) {
      if (!isSubScoreInBounds(parsed[field])) {
        console.error(`❌ Sub-score ${field} out of bounds: ${parsed[field]}`);
        return null;
      }
    }

    // Sanity check: sub-scores should roughly sum to jr_score
    const subScoreSum =
      parsed.confidence +
      parsed.clarity +
      parsed.consistency +
      parsed.execution_readiness;
    if (Math.abs(subScoreSum - parsed.jr_score) > 15) {
      console.warn(
        `⚠️ Sub-scores (${subScoreSum}) don't match jr_score (${parsed.jr_score}), but allowing`
      );
      // Don't fail, just warn - this isn't critical
    }

    return parsed;
  } catch (error: any) {
    console.error("❌ Failed to parse Gemini response:", error.message);
    return null;
  }
}

/**
 * Clamp all scores to valid bounds
 * Extra safety layer even after validation
 */
function clampJRScore(data: GeminiJRScoreResponse): GeminiJRScoreResponse {
  return {
    ...data,
    jr_score: Math.min(
      JR_SCORE_LIMITS.MAX_SCORE,
      Math.max(JR_SCORE_LIMITS.MIN_SCORE, Math.round(data.jr_score))
    ),
    confidence: Math.min(
      JR_SCORE_LIMITS.MAX_SUB_SCORE,
      Math.max(JR_SCORE_LIMITS.MIN_SUB_SCORE, Math.round(data.confidence))
    ),
    clarity: Math.min(
      JR_SCORE_LIMITS.MAX_SUB_SCORE,
      Math.max(JR_SCORE_LIMITS.MIN_SUB_SCORE, Math.round(data.clarity))
    ),
    consistency: Math.min(
      JR_SCORE_LIMITS.MAX_SUB_SCORE,
      Math.max(JR_SCORE_LIMITS.MIN_SUB_SCORE, Math.round(data.consistency))
    ),
    execution_readiness: Math.min(
      JR_SCORE_LIMITS.MAX_SUB_SCORE,
      Math.max(
        JR_SCORE_LIMITS.MIN_SUB_SCORE,
        Math.round(data.execution_readiness)
      )
    ),
    risk_flags: Array.isArray(data.risk_flags) ? data.risk_flags : [],
    reasoning:
      typeof data.reasoning === "string" ? data.reasoning : "Score calculated",
  };
}

// ============================================================================
// FALLBACK SCORING (WHEN GEMINI FAILS)
// ============================================================================

/**
 * Generate deterministic fallback score based on available user data
 * Never returns error to frontend - always a valid score
 */
function generateFallbackScore(
  context: UserScoringContext
): GeminiJRScoreResponse {
  // Base score starts at 35
  let baseScore = 35;
  let confidence = 8;
  let clarity = 8;
  let consistency = 10;
  let executionReadiness = 9;
  const riskFlags: string[] = ["ai_fallback"];

  // Boost based on available data completeness
  if (context.name) baseScore += 2;
  if (context.college) baseScore += 3;
  if (context.course) baseScore += 3;

  // Skills boost
  const skillCount = context.subjects?.length || 0;
  if (skillCount > 0) {
    baseScore += Math.min(skillCount * 2, 10);
    consistency += Math.min(skillCount, 5);
  }

  // Career aspiration clarity
  if (context.careerAspiration) {
    clarity += 5;
    baseScore += 5;
  }

  // Status-based adjustment
  switch (context.status) {
    case "Working":
      executionReadiness += 7;
      confidence += 5;
      baseScore += 10;
      break;
    case "Graduate":
      executionReadiness += 3;
      confidence += 2;
      baseScore += 5;
      break;
    case "Student":
      // Students get lower execution readiness by default
      executionReadiness += 1;
      break;
  }

  // CGPA boost
  if (context.cgpa && context.cgpa > 7) {
    baseScore += Math.min((context.cgpa - 7) * 3, 9);
    consistency += 3;
  }

  // Resume presence
  if (context.resumeUrl) {
    baseScore += 5;
    executionReadiness += 3;
  }

  // Ensure sub-scores don't exceed limits
  confidence = Math.min(confidence, 25);
  clarity = Math.min(clarity, 25);
  consistency = Math.min(consistency, 25);
  executionReadiness = Math.min(executionReadiness, 25);

  // Calculate final score (capped at 75 for fallback - be conservative)
  const finalScore = Math.min(baseScore, 75);

  return {
    jr_score: finalScore,
    confidence,
    clarity,
    consistency,
    execution_readiness: executionReadiness,
    risk_flags: riskFlags,
    reasoning:
      "Fallback score generated based on profile completeness. AI evaluation unavailable.",
  };
}

// ============================================================================
// MAIN SCORING FUNCTION (PUBLIC API)
// ============================================================================

/**
 * Build the full prompt for Gemini including user context
 */
function buildScoringPrompt(
  context: UserScoringContext,
  chatHistory?: OnboardingChatMessage[]
): string {
  // Build user profile summary
  const profileLines = [
    `Name: ${context.name || "Unknown"}`,
    `Status: ${context.status}`,
    context.age ? `Age: ${context.age}` : null,
    context.gender ? `Gender: ${context.gender}` : null,
    context.state && context.city
      ? `Location: ${context.city}, ${context.state}`
      : null,
    context.college ? `College: ${context.college}` : null,
    context.course ? `Course: ${context.course}` : null,
    context.stream ? `Stream: ${context.stream}` : null,
    context.semester ? `Semester: ${context.semester}` : null,
    context.passoutYear ? `Graduation Year: ${context.passoutYear}` : null,
    context.cgpa ? `CGPA: ${context.cgpa}` : null,
    context.subjects?.length ? `Skills: ${context.subjects.join(", ")}` : null,
    context.careerAspiration
      ? `Career Aspiration: ${context.careerAspiration}`
      : null,
    context.selectedRoleName
      ? `Target Role: ${context.selectedRoleName}`
      : null,
    context.resumeUrl ? `Resume: Uploaded` : `Resume: Not uploaded`,
  ]
    .filter(Boolean)
    .join("\n");

  // Build chat history if available
  let chatSection = "";
  if (chatHistory && chatHistory.length > 0) {
    chatSection =
      "\n\nOnboarding Chat History:\n" +
      chatHistory
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n");
  }

  return `${JR_SCORE_SYSTEM_PROMPT}

User Profile:
${profileLines}
${chatSection}

Now calculate the JR Score for this user. Respond with ONLY the JSON object, no other text.`;
}

/**
 * Calculate JR Score using Gemini AI with full safety guarantees
 *
 * This is THE main entry point for JR score calculation.
 * NEVER throws. ALWAYS returns a valid score.
 *
 * @param context User profile data from onboarding
 * @param chatHistory Optional chat messages for context
 * @returns JRScoreResult with score, breakdown, and metadata
 */
export async function calculateJRScore(
  context: UserScoringContext,
  chatHistory?: OnboardingChatMessage[]
): Promise<JRScoreResult> {
  const startTime = Date.now();

  // Check if Gemini is configured
  if (!GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY not set - using fallback scoring");
    const fallback = generateFallbackScore(context);
    return {
      ...fallback,
      source: "fallback",
      generated_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime,
    };
  }

  try {
    console.log("🤖 Calling Gemini for JR score calculation...");

    // Build prompt
    const prompt = buildScoringPrompt(context, chatHistory);

    // Call Gemini
    const rawResponse = await callGeminiAPI(prompt);

    console.log("📥 Gemini raw response received");

    // Validate response
    const validated = validateGeminiResponse(rawResponse);

    if (!validated) {
      console.error("❌ Gemini response failed validation - using fallback");
      const fallback = generateFallbackScore(context);
      return {
        ...fallback,
        source: "fallback",
        generated_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      };
    }

    // Clamp scores (extra safety)
    const clamped = clampJRScore(validated);

    console.log(
      `✅ Gemini JR Score: ${clamped.jr_score} (took ${
        Date.now() - startTime
      }ms)`
    );

    return {
      ...clamped,
      source: "gemini",
      generated_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime,
    };
  } catch (error: any) {
    // SHOCK ABSORBER: Log error but return fallback
    console.error("❌ Gemini call failed:", error.message);

    const fallback = generateFallbackScore(context);
    return {
      ...fallback,
      source: "fallback",
      generated_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime,
    };
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Quick health check for Gemini API
 * Use for monitoring/status endpoints
 */
export async function checkGeminiHealth(): Promise<{
  available: boolean;
  latencyMs?: number;
  error?: string;
}> {
  if (!GEMINI_API_KEY) {
    return { available: false, error: "API key not configured" };
  }

  const start = Date.now();
  try {
    await callGeminiAPI('Respond with: {"status": "ok"}');
    return { available: true, latencyMs: Date.now() - start };
  } catch (error: any) {
    return {
      available: false,
      latencyMs: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}

export default {
  calculateJRScore,
  checkGeminiHealth,
  isGeminiConfigured,
};
