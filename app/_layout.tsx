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

import { useEffect, useState } from "react";
import { Stack, router, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text, ActivityIndicator } from "react-native";
import * as Linking from "expo-linking";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";

// Import hooks
import { useDeepLinkAuth } from "../hooks/useDeepLinkAuth";

// Import global styles
import "../styles/global";

// Keep the splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const rootNavigationState = useRootNavigationState();
  const [appIsReady, setAppIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup OAuth deep link handler (listens for JWT tokens)
  useDeepLinkAuth();

  // Load resources
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, images, make API calls, etc.
        // Add a small delay to ensure everything is loaded
        await new Promise((resolve) => setTimeout(resolve, 100));
        setAppIsReady(true);
      } catch (e) {
        console.error("Error loading app:", e);
        setError(e instanceof Error ? e.message : "Unknown error");
        setAppIsReady(true); // Still show app even if there's an error
      }
    }

    prepare();
  }, []);

  // Hide splash screen when ready
  useEffect(() => {
    if (appIsReady && rootNavigationState?.key) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, rootNavigationState?.key]);

  // Load custom fonts if needed
  useEffect(() => {
    async function loadFonts() {
      // Fonts can be loaded here if custom fonts are added
    }
    loadFonts();
  }, []);

  // Conditional returns AFTER all hooks
  if (!appIsReady || !rootNavigationState?.key) {
    return null; // Splash screen is showing
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: "red", marginBottom: 10 }}>App Error:</Text>
        <Text>{error}</Text>
      </View>
    );
  }

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
