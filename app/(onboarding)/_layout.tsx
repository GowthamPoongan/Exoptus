/**
 * Onboarding Stack Layout
 *
 * Contains the conversational onboarding flow:
 * - Chat interface
 * - Consent screens
 * - Evaluation
 */

import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#FFFFFF" },
        gestureEnabled: false, // Prevent accidental back during onboarding
      }}
    >
      <Stack.Screen name="chat" />
      <Stack.Screen name="consent" />
      <Stack.Screen name="evaluation" />
    </Stack>
  );
}
