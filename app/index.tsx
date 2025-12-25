/**
 * EXOPTUS App Entry Point
 *
 * This redirects to the welcome screen on app launch.
 * The redirect happens automatically via Expo Router.
 */

import { Redirect } from "expo-router";

export default function Index() {
  // Redirect to the welcome screen on app start
  // In production, this could check auth state and redirect accordingly
  return <Redirect href="/(auth)/welcome" />;
}
