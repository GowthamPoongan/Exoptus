/**
 * Onboarding Utilities
 *
 * Handles:
 * - Onboarding step tracking
 * - Progress updates
 * - Redirect logic based on completion status
 */

import prisma from "./prisma";

// Define onboarding steps in order
export const ONBOARDING_STEPS = [
  "chat", // Step 1: Onboarding chat (main experience)
  "evaluation_progress", // Step 2: Evaluation
  "analysis_results", // Step 3: Show results
  "analysis_complete", // Step 4: Complete
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/**
 * Get the next onboarding step
 */
export function getNextStep(currentStep: string | null): string | null {
  if (!currentStep) {
    return ONBOARDING_STEPS[0];
  }

  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep as OnboardingStep);

  if (currentIndex === -1 || currentIndex === ONBOARDING_STEPS.length - 1) {
    return null; // No next step or unknown step
  }

  return ONBOARDING_STEPS[currentIndex + 1];
}

/**
 * Check if onboarding is complete based on current step
 */
export function isOnboardingComplete(step: string | null): boolean {
  return step === "analysis_complete" || step === null;
}

/**
 * Update user's onboarding progress
 */
export async function updateOnboardingProgress(
  userId: string,
  completedStep: string
) {
  const nextStep = getNextStep(completedStep);
  const isComplete = nextStep === null || isOnboardingComplete(nextStep);

  const updateData: any = {
    lastCompletedStep: completedStep,
    onboardingStep: isComplete ? null : nextStep,
    onboardingStatus: isComplete ? "completed" : "in_progress",
  };

  if (isComplete) {
    updateData.onboardingCompleted = true;
    updateData.onboardingCompletedAt = new Date();
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return user;
}

/**
 * Get redirect path based on user's onboarding status
 * This helps determine where to send the user after authentication
 */
export function getRedirectPath(user: {
  onboardingCompleted: boolean;
  onboardingStep: string | null;
}): string {
  // If onboarding is complete, go to main app
  if (user.onboardingCompleted) {
    return "/(main)/home";
  }

  // If onboarding not complete, resume where they left off
  const step = user.onboardingStep || ONBOARDING_STEPS[0];

  // Map onboarding steps to routes
  const stepRouteMap: Record<string, string> = {
    chat: "/(onboarding)/chat",
    evaluation_progress: "/(onboarding)/evaluation-progress",
    analysis_results: "/(onboarding)/analysis-results",
    analysis_complete: "/(onboarding)/analysis-complete",
  };

  return stepRouteMap[step] || "/(onboarding)/chat";
}

/**
 * Add an auth provider to user's account (for account linking)
 */
export async function addAuthProvider(
  userId: string,
  provider: "email" | "google",
  additionalData?: { googleId?: string }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Parse current providers
  const currentProviders = user.authProviders.split(",").filter(Boolean);

  // Check if provider already linked
  if (currentProviders.includes(provider)) {
    return user;
  }

  // Add new provider
  const updatedProviders = [...currentProviders, provider].join(",");

  const updateData: any = {
    authProviders: updatedProviders,
  };

  // Add Google ID if linking Google account
  if (provider === "google" && additionalData?.googleId) {
    updateData.googleId = additionalData.googleId;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return updatedUser;
}

/**
 * Check if user has a specific auth provider linked
 */
export function hasAuthProvider(
  user: { authProviders: string },
  provider: "email" | "google"
): boolean {
  return user.authProviders.split(",").includes(provider);
}
