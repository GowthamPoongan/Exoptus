/**
 * AuthSession Service - Production OAuth Flow
 *
 * Handles Expo-native OAuth authentication using:
 * - AuthSession (launches system browser)
 * - WebBrowser (manages browser lifecycle)
 * - Server-side token exchange (jose verification)
 * - SecureStore (token persistence)
 *
 * CRITICAL: Expo never talks to Google directly.
 * Backend owns the token exchange and JWT issuance.
 */

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import api from "./api";

// Storage keys
const TOKEN_KEY = "exoptus_auth_token";
const REFRESH_TOKEN_KEY = "exoptus_refresh_token";
const USER_KEY = "exoptus_user";

interface AuthSessionResponse {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

/**
 * Initialize AuthSession with platform-specific config
 * MUST be called before using AuthSession functions
 */
export function useAuthSession() {
  const isDevelopment = process.env.EXPO_PUBLIC_APP_MODE === "development";

  console.log(
    `🔍 Environment check: EXPO_PUBLIC_APP_MODE="${process.env.EXPO_PUBLIC_APP_MODE}" → isDevelopment=${isDevelopment}`
  );

  // In development (Expo Go), we MUST use Expo's OAuth proxy
  // because Google doesn't accept exp:// scheme or raw IP addresses
  const redirectUri = isDevelopment
    ? `https://auth.expo.io/@exoptus/exoptus` // Expo's OAuth proxy
    : AuthSession.makeRedirectUri({
        scheme: "googleoauthexoptus",
        path: "auth",
      });

  console.log(
    `🌐 Using Expo proxy: ${isDevelopment ? "YES ✅" : "NO (Custom scheme)"}`
  );
  console.log(`📱 Redirect URI: ${redirectUri}`);

  /**
   * Launch Google OAuth flow (system browser only)
   * Returns JWT from backend if successful
   */
  async function signInWithGoogle(): Promise<AuthSessionResponse> {
    try {
      // Validate redirect URI
      if (!redirectUri) {
        return {
          success: false,
          error: "Failed to create redirect URI",
        };
      }

      console.log("🔐 AuthSession: Starting Google OAuth flow");
      console.log(`📱 Redirect URI: ${redirectUri}`);

      // Step 1: Build OAuth URL
      // Backend will redirect to Google OAuth consent screen
      const authUrl = `${api.getBaseUrl()}/auth/google/start?redirect=${encodeURIComponent(
        redirectUri
      )}`;

      console.log(`🌐 Opening browser: ${authUrl}`);

      // Step 2: Open browser using WebBrowser
      // When useProxy: true, Expo handles the OAuth callback automatically
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      console.log("📲 AuthSession result:", result.type);

      // Step 3: Handle browser response
      if (result.type === "success") {
        const url = new URL(result.url);
        const token = url.searchParams.get("token");
        const error = url.searchParams.get("error");

        if (error) {
          console.error("❌ OAuth error from backend:", error);
          return {
            success: false,
            error: `OAuth failed: ${error}`,
          };
        }

        if (!token) {
          console.error("❌ No token received in redirect");
          return {
            success: false,
            error: "No authentication token received",
          };
        }

        // Step 4: Store JWT securely
        await SecureStore.setItemAsync(TOKEN_KEY, token);

        // Fetch user profile to verify session
        try {
          api.setAuthToken(token);
          const response = await api.get("/user/profile");

          if (response.success && response.data) {
            const userData = (response.data as any).user;
            if (userData) {
              await SecureStore.setItemAsync(
                USER_KEY,
                JSON.stringify(userData)
              );
            }

            console.log("✅ AuthSession: Sign-in successful");
            return {
              success: true,
              token,
              user: userData,
            };
          }
        } catch (profileError) {
          console.error("⚠️ Failed to fetch user profile, but token valid");
          // Token is valid, proceed anyway
          return {
            success: true,
            token,
          };
        }
      } else if (result.type === "dismiss") {
        console.log("❌ AuthSession: User dismissed auth");
        return {
          success: false,
          error: "Authentication cancelled",
        };
      }

      return {
        success: false,
        error: "Unknown authentication error",
      };
    } catch (error: any) {
      console.error("❌ AuthSession error:", error);
      return {
        success: false,
        error: error.message || "Authentication failed",
      };
    }
  }

  /**
   * Restore token from secure storage
   * Called on app startup to resume session
   */
  async function restoreToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);

      if (token) {
        // Verify token is still valid with backend
        api.setAuthToken(token);
        const response = await api.get("/auth/validate-token");

        if (response.success) {
          console.log("✅ Token restored from secure storage");
          return token;
        } else {
          // Token expired, clear storage
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          console.log("⏰ Token expired, cleared from storage");
          return null;
        }
      }

      return null;
    } catch (error: any) {
      console.error("Failed to restore token:", error);
      return null;
    }
  }

  /**
   * Sign out and clear stored credentials
   */
  async function signOut(): Promise<void> {
    try {
      // Notify backend to invalidate session
      try {
        await api.post("/auth/logout", {});
      } catch (e) {
        // Backend may be unreachable, continue cleanup anyway
      }

      // Clear secure storage
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);

      // Clear API auth
      api.setAuthToken(null);

      console.log("✅ Signed out successfully");
    } catch (error: any) {
      console.error("Error during sign out:", error);
      throw error;
    }
  }

  /**
   * Get current stored user profile
   */
  async function getStoredUser(): Promise<any | null> {
    try {
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error("Failed to get stored user:", error);
      return null;
    }
  }

  return {
    redirectUri,
    signInWithGoogle,
    restoreToken,
    signOut,
    getStoredUser,
  };
}
