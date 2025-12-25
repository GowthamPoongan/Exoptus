/**
 * Auth Stack Layout
 *
 * Contains all authentication-related screens:
 * - Welcome (entry point)
 * - Sign In
 * - Sign Up with Email
 * - Email Verification
 *
 * UX Intent: Smooth, guided flow with meaningful transitions
 */

import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#FFFFFF" },
        // Smooth gesture-based back navigation
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{
          animation: "fade",
          gestureEnabled: false, // No back from welcome
        }}
      />
      <Stack.Screen
        name="signin"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="signup-email"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="email-verification"
        options={{
          animation: "slide_from_right",
          // User should be able to go back to change email
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
