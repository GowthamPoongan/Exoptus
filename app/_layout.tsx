/**
 * EXOPTUS Root Layout
 *
 * This is the root layout for the entire app.
 * It sets up:
 * - Safe area context for proper screen padding
 * - Gesture handler for swipe interactions
 * - Status bar configuration
 * - Global providers
 * - Deep link handling for magic links
 */

import { useEffect } from "react";
import { Stack, router, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import * as Font from "expo-font";

// Import global styles
import "../styles/global";

export default function RootLayout() {
  const rootNavigationState = useRootNavigationState();

  // Handle deep links
  useEffect(() => {
    // Only handle deep links when navigation is ready
    if (!rootNavigationState?.key) return;

    // Handle initial URL (app opened via deep link)
    const handleInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLink(url);
      }
    };

    // Handle URL when app is already open
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, [rootNavigationState?.key]);

  const handleDeepLink = async (url: string) => {
    // Parse the URL to extract params
    const parsed = Linking.parse(url);

    // Extract token from URL
    let token: string | null = null;
    if (
      parsed.queryParams?.token &&
      typeof parsed.queryParams.token === "string"
    ) {
      token = parsed.queryParams.token;
    }
    if (!token && url.includes("token=")) {
      const match = url.match(/token=([^&]+)/);
      if (match) token = match[1];
    }

    // Check for Google OAuth callback
    const isGoogleCallback =
      parsed.path?.includes("google-callback") ||
      url.includes("google-callback");
    if (isGoogleCallback && token) {
      // Import and use auth service to handle the callback
      const authService = require("../services/auth").default;
      const { useUserStore } = require("../store/userStore");

      try {
        const result = await authService.handleGoogleCallback(token);
        if (result.success && result.user) {
          useUserStore.getState().setUser(result.user);
          const route = authService.getRouteForUser(result.user);
          router.replace(route);
        }
      } catch (error) {
        // Error handling Google callback
      }
      return;
    }

    // Check if this is a verify link (magic link)
    const isVerifyPath =
      parsed.path?.includes("verify") || url.includes("/verify");
    if (isVerifyPath && token) {
      router.replace({
        pathname: "/(auth)/verifying",
        params: { token },
      });
      return;
    }

    // Ignore other OAuth-related URLs
    if (
      url.includes("id_token=") ||
      url.includes("access_token=") ||
      url.includes("code=")
    ) {
      return;
    }
  };

  // Load custom fonts if needed
  useEffect(() => {
    async function loadFonts() {
      // Fonts can be loaded here if custom fonts are added
    }
    loadFonts();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Status bar is light on welcome/auth screens */}
        <StatusBar style="dark" />

        {/* 
          Main navigation stack
          - Screens are grouped by purpose (auth, onboarding, main)
          - Animations are configured per group for UX consistency
        */}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: "#FFFFFF" },
          }}
        >
          {/* Auth flow screens */}
          <Stack.Screen
            name="(auth)"
            options={{
              animation: "fade",
            }}
          />

          {/* Onboarding conversational flow */}
          <Stack.Screen
            name="(onboarding)"
            options={{
              animation: "slide_from_bottom",
              gestureEnabled: false, // Prevent accidental back during onboarding
            }}
          />

          {/* Main app screens */}
          <Stack.Screen
            name="(main)"
            options={{
              animation: "fade",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
