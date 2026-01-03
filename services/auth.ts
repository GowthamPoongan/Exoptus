/**
 * Auth Service
 *
 * Handles authentication-related API calls.
 * Magic link flow, Google OAuth, token management.
 *
 * Routes users based on onboarding_status:
 * - not_started / in_progress -> Onboarding chat
 * - completed -> Dashboard/Home
 */

import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, OnboardingStatus } from "../types";

// Storage keys
const TOKEN_KEY = "exoptus_auth_token";
const REFRESH_TOKEN_KEY = "exoptus_refresh_token";
const USER_KEY = "exoptus_user";

interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

interface MagicLinkResponse {
  success: boolean;
  message: string;
  email: string;
}

interface SessionResponse {
  valid: boolean;
  user: User;
}

class AuthService {
  /**
   * Send magic link to email
   * Initiates email-based passwordless authentication
   */
  async sendMagicLink(
    email: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const response = await api.post<MagicLinkResponse>("/auth/email/start", {
      email,
    });

    return {
      success: response.success,
      message: response.data?.message,
      error: response.error,
    };
  }

  /**
   * Verify magic link token from email
   * Returns user with onboarding_status for routing
   */
  async verifyMagicLink(
    token: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const response = await api.post<any>("/auth/email/verify", {
      token,
    });

    // API wraps in { success, data } - backend also returns { success, data }
    // So structure is: { success: true, data: { success: true, data: { token, user } } }
    // OR backend returns directly: { success: true, data: { token, user } } where data has the auth response

    if (response.success && response.data) {
      // Check if backend wrapped in success/data or returned directly
      const authData = response.data.data || response.data;

      if (authData.token && authData.user) {
        await this.setTokens(authData.token, authData.refreshToken);
        await this.cacheUser(authData.user);
        api.setAuthToken(authData.token);

        return {
          success: true,
          user: authData.user,
        };
      }
    }

    return {
      success: false,
      error: response.error || response.data?.error || "Verification failed",
    };
  }

  /**
   * Google Sign In
   * Authenticate with Google ID token
   * Returns isReturningUser flag if user has existing onboarding data
   */
  async googleSignIn(idToken: string): Promise<{
    success: boolean;
    user?: User;
    isReturningUser?: boolean;
    error?: string;
  }> {
    const response = await api.post<{
      data: AuthResponse & { isReturningUser?: boolean };
    }>("/auth/google", {
      idToken,
    });

    // Handle new nested response structure: { success: true, data: { token, user, redirectTo, isReturningUser } }
    if (response.success && response.data?.data) {
      const authData = response.data.data;
      await this.setTokens(authData.token, authData.refreshToken);
      await this.cacheUser(authData.user);
      api.setAuthToken(authData.token);

      const isReturning =
        authData.isReturningUser || this.hasOnboardingData(authData.user);

      return {
        success: true,
        user: authData.user,
        isReturningUser: isReturning,
      };
    }

    return {
      success: false,
      error: response.error || "Google sign-in failed",
    };
  }

  /**
   * Check if user has existing onboarding data
   */
  hasOnboardingData(user: User): boolean {
    // User has data if they've started onboarding
    if (
      user.onboardingStatus === "in_progress" ||
      user.onboardingStatus === "completed"
    ) {
      return true;
    }
    if (user.onboardingStep && user.onboardingStep !== "intro_carousel") {
      return true;
    }
    if (user.onboardingCompleted) {
      return true;
    }
    // Check if onboardingData exists (legacy field)
    if ((user as any).onboardingData) {
      return true;
    }
    return false;
  }

  /**
   * Reset user onboarding data (fresh start)
   */
  async resetOnboarding(): Promise<{ success: boolean; error?: string }> {
    const response = await api.post<{ success: boolean }>(
      "/auth/reset-onboarding",
      {}
    );

    if (response.success) {
      // Update cached user
      const cachedUser = await this.getCachedUser();
      if (cachedUser) {
        cachedUser.onboardingStatus = "not_started";
        cachedUser.onboardingStep = "intro_carousel";
        cachedUser.onboardingCompleted = false;
        await this.cacheUser(cachedUser);
      }
      return { success: true };
    }

    return {
      success: false,
      error: response.error || "Failed to reset onboarding",
    };
  }

  /**
   * Handle Google OAuth callback from server-side flow
   * The server already created the session and returned a JWT token
   */
  async handleGoogleCallback(
    token: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Store the token
      await this.setTokens(token);
      api.setAuthToken(token);

      // Fetch user session to get user data
      const response = await api.get<{ data: { user: User } }>("/auth/session");

      if (response.success && response.data?.data?.user) {
        const user = response.data.data.user;
        await this.cacheUser(user);
        return {
          success: true,
          user,
        };
      }

      return {
        success: false,
        error: "Failed to get user session",
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to complete sign-in",
      };
    }
  }

  /**
   * Check if user is authenticated
   * Validates session with server and returns user
   */
  async checkAuth(): Promise<{ isAuthenticated: boolean; user?: User }> {
    const token = await this.getToken();

    if (!token) {
      return { isAuthenticated: false };
    }

    api.setAuthToken(token);

    // Validate session with server
    const response = await api.get<any>("/auth/session");

    // Handle response format: { success: true, data: { user: {...} } }
    if (response.success && response.data) {
      const user = response.data.user || response.data.data?.user;
      if (user) {
        await this.cacheUser(user);
        return {
          isAuthenticated: true,
          user,
        };
      }
    }

    // Don't logout on session check failure - might be network issue
    // Just return not authenticated, user can try again
    return { isAuthenticated: false };
  }

  /**
   * Get cached user from storage (for offline access)
   */
  async getCachedUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  /**
   * Determine routing based on onboarding status
   * New schema uses: onboardingCompleted, onboardingStep
   * Legacy field: onboardingStatus
   */
  getRouteForUser(
    user: User
  ):
    | "/(onboarding)/intro-carousel"
    | "/(onboarding)/chat"
    | "/(onboarding)/evaluation-progress"
    | "/(main)/home" {
    // Check new schema fields first
    if (user.onboardingCompleted) {
      return "/(main)/home";
    }

    // Route based on current step
    if (user.onboardingStep) {
      const stepRoutes: Record<string, any> = {
        intro_carousel: "/(onboarding)/intro-carousel",
        chat: "/(onboarding)/chat",
        evaluation_progress: "/(onboarding)/evaluation-progress",
        analysis_results: "/(onboarding)/analysis-results",
        analysis_complete: "/(main)/home",
      };
      return stepRoutes[user.onboardingStep] || "/(onboarding)/intro-carousel";
    }

    // Fallback to legacy field
    if (user.onboardingStatus === "completed") {
      return "/(main)/home";
    }

    // Default to chat for onboarding
    return "/(onboarding)/chat";
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<boolean> {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      return false;
    }

    const response = await api.post<{ token: string }>("/auth/refresh", {
      refreshToken,
    });

    if (response.success && response.data) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      api.setAuthToken(response.data.token);
      return true;
    }

    return false;
  }

  /**
   * Logout - clear all auth data
   */
  async logout(): Promise<void> {
    // Call server logout (invalidates session)
    try {
      await api.post("/auth/logout", {});
    } catch {
      // Continue with local cleanup even if server call fails
    }

    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    api.setAuthToken(null);
  }

  // Token management helpers
  private async setTokens(token: string, refreshToken?: string): Promise<void> {
    if (!token) {
      return;
    }
    await AsyncStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  private async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  private async cacheUser(user: User): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export const authService = new AuthService();
export default authService;
