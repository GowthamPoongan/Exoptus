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
import CalendarModal from "../components/CalendarModal";
import { useDashboardStore } from "../store/dashboardStore";

// Import global styles
import "../styles/global";

export default function RootLayout() {
  const rootNavigationState = useRootNavigationState();

  // Handle deep links
  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    const handleInitialURL = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          handleDeepLink(url);
        }
      } catch (e) {
        console.error("Error getting initial URL:", e);
      }
    };

    // Handle URL when app is already open
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    // Run immediately (don't wait for navigation key) so we can intercept
    // custom-scheme deep links that sometimes arrive before expo-router is ready.
    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (rawUrl: string) => {
    console.log("📱 Deep link received:", rawUrl);

    // Some environments (expo dev client) wrap the real URL inside a query param
    // e.g. exp+exoptus://expo-development-client/?url=https%3A%2F%2Fexample.com%2Fverify%3Ftoken%3Dabc
    // Normalize by extracting nested `url` when present.
    let url = rawUrl;
    try {
      const top = Linking.parse(rawUrl);
      // If there's a nested `url` param, use that
      if (top.queryParams && typeof top.queryParams.url === "string") {
        url = decodeURIComponent(top.queryParams.url as string);
        console.log("📱 Detected nested url, normalized to:", url);
      }
    } catch (e) {
      // fall back to rawUrl
    }

    const parsed = Linking.parse(url);

    // If the app was opened with the custom scheme but no path (e.g. "exoptus://"),
    // redirect to the welcome screen.
    const scheme = parsed.scheme?.toLowerCase() || "";
    if (
      (scheme.includes("exoptus") && (!parsed.path || parsed.path === "")) ||
      /^exoptus:\/\/*$/.test(url)
    ) {
      console.log("📱 Deep link with empty path — redirecting to welcome");
      router.replace("/(auth)/welcome");
      return;
    }

    console.log("📱 Parsed URL:", JSON.stringify(parsed, null, 2));

    // Robust token extraction
    let token: string | null = null;
    if (
      parsed.queryParams?.token &&
      typeof parsed.queryParams.token === "string"
    ) {
      token = parsed.queryParams.token as string;
    }
    if (!token) {
      const m = url.match(/token=([^&]+)/);
      if (m) token = m[1];
    }

    // Check for Google OAuth callback
    const isGoogleCallback =
      (parsed.path && parsed.path.includes("google-callback")) ||
      url.includes("google-callback");
    if (isGoogleCallback && token) {
      console.log("📱 ✅ Google OAuth callback with token");
      const authService = require("../../../services/auth").default;
      const { useUserStore } = require("../store/userStore");

      try {
        const result = await authService.handleGoogleCallback(token);
        if (result.success && result.user) {
          console.log("✅ Google sign-in successful via deep link");
          useUserStore.getState().setUser(result.user);
          const route = authService.getRouteForUser(result.user);
          router.replace(route);
        } else {
          console.log("❌ Google sign-in failed:", result.error);
        }
      } catch (error) {
        console.error("❌ Error handling Google callback:", error);
      }
      return;
    }

    // Check if this is a verify link (magic link)
    const isVerifyPath =
      (parsed.path && parsed.path.includes("verify")) ||
      url.includes("/verify");
    if (isVerifyPath && token) {
      console.log(
        "📱 ✅ Navigating to verify with token:",
        token.substring(0, 20) + "..."
      );
      router.replace({ pathname: "/(auth)/verifying", params: { token } });
      return;
    }

    // Ignore other OAuth-related URLs
    if (
      url.includes("id_token=") ||
      url.includes("access_token=") ||
      url.includes("code=")
    ) {
      console.log("📱 OAuth params detected, ignoring");
      return;
    }

    console.log("📱 ❌ Unhandled deep link");
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
        {/* Global Calendar Modal so any header can open it */}
        <CalendarModal
          visible={useDashboardStore((s) => s.isCalendarOpen)}
          onClose={() => useDashboardStore.getState().setCalendarOpen(false)}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
