/**
 * Main App Layout with Tab Navigation
 *
 * Contains the main app screens with bottom tab navigation:
 * - Home dashboard
 * - Roadmap
 * - Explore
 * - Resume
 * - Profile
 *
 * UX Intent:
 * - Premium white glass floating dock-style tab bar
 * - Smooth tab transitions
 * - Hide tab bar for Odyssey screen
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack, usePathname } from "expo-router";
import { PremiumBottomTabBar } from "../../components/PremiumBottomTabBar";

export default function MainLayout() {
  const pathname = usePathname();

  // Hide tab bar on Odyssey screen for full immersion
  const showTabBar = !pathname.includes("odyssey");

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "#0A0A0F" },
        }}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="roadmap" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="resume" />
        <Stack.Screen name="profile" />
        <Stack.Screen
          name="notifications"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="calendar"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="odyssey"
          options={{
            animation: "fade",
            presentation: "fullScreenModal",
          }}
        />
      </Stack>

      {/* Premium Floating Bottom Tab Bar - White Glass Dock */}
      {showTabBar && <PremiumBottomTabBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
});
