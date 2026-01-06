/**
 * useDeepLinkAuth Hook
 *
 * Listens for deep link redirects from OAuth callback
 * Extracts JWT token from URL and authenticates user
 *
 * Usage in root layout:
 * useDeepLinkAuth();
 */

import { useEffect } from "react";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { useUserStore } from "../store";
import api from "../services/api";

const TOKEN_KEY = "exoptus_auth_token";
const USER_KEY = "exoptus_user";

export function useDeepLinkAuth() {
  useEffect(() => {
    // Handle deep links from OAuth redirect
    const handleDeepLink = async ({ url }: { url: string }) => {
      console.log("🔗 Deep link received:", url);

      try {
        // Parse the URL
        const parsed = Linking.parse(url);
        const token = parsed.queryParams?.token as string;
        const jwt = parsed.queryParams?.jwt as string;
        const userParam = parsed.queryParams?.user as string;
        const redirectTo = parsed.queryParams?.redirectTo as string;

        console.log("🎫 Params:", {
          hasToken: !!token,
          hasJWT: !!jwt,
          hasUser: !!userParam,
        });

        // FAST PATH: JWT + user already provided (from email verification)
        if (
          jwt &&
          userParam &&
          (parsed.path === "auth/verify" || url.includes("auth/verify"))
        ) {
          console.log("⚡ Fast email verification - JWT already provided");

          // Route to verifying screen with JWT and user data
          // The verifying screen will handle animation and "Continue" button
          router.push({
            pathname: "/(auth)/verifying",
            params: {
              jwt: jwt,
              user: userParam,
              redirectTo: redirectTo || "",
            },
          });
          return;
        }

        // Check if this is an email verification deep link with token (POST flow)
        if (
          token &&
          (parsed.path === "auth/verify" || url.includes("auth/verify"))
        ) {
          console.log("📧 Email verification with token - need to POST verify");
          // Navigate to verifying screen with token
          router.push({
            pathname: "/(auth)/verifying",
            params: { token },
          });
          return;
        }

        // OAuth flow - JWT token directly
        if (token) {
          console.log("🔑 OAuth token flow");
          // Store JWT in secure storage
          await SecureStore.setItemAsync(TOKEN_KEY, token);

          // Set API auth token
          api.setAuthToken(token);

          // Fetch user profile to populate store
          try {
            const response = await api.get("/user/profile");

            if (response.success && response.data) {
              const user = (response.data as any).user;

              if (user) {
                // Cache user in secure storage
                await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

                // Update Zustand store
                useUserStore.setState({
                  user,
                });

                console.log(`✅ Authenticated as: ${user.email}`);

                // Route based on onboarding status
                if (
                  user.onboardingStatus === "not_started" ||
                  user.onboardingStatus === "in_progress"
                ) {
                  // Go to onboarding
                  router.replace("/(onboarding)/chat");
                } else {
                  // Go to home
                  router.replace("/(main)/home");
                }
              }
            }
          } catch (error) {
            console.error("Failed to fetch user profile after OAuth:", error);
            // Token is valid, navigate anyway
            router.replace("/(main)/home");
          }
        } else {
          console.log("⚠️ No token or jwt found in deep link");
        }
      } catch (error) {
        console.error("Deep link handler error:", error);
      }
    };

    // Subscribe to deep links
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Handle initial URL (if app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url != null) {
        handleDeepLink({ url });
      }
    });

    // Cleanup subscription
    return () => {
      subscription.remove();
    };
  }, []);
}
