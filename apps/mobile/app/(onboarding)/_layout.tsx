/**
 * Onboarding Stack Layout
 *
 * Contains the conversational onboarding flow:
 * - Intro carousel
 * - Chat interface
 * - Evaluation progress
 * - Analysis results
 * - Analysis complete
 */

import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#0A0A0F" },
        gestureEnabled: false, // Prevent accidental back during onboarding
      }}
    >
      <Stack.Screen name="intro-carousel" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="evaluation-progress" />
      <Stack.Screen name="analysis-results" />
      <Stack.Screen name="analysis-complete" />
    </Stack>
  );
}
