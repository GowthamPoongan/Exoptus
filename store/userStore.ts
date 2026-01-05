/**
 * User Store
 *
 * Global state management for user data using Zustand.
 * Persists user session across app restarts.
 *
 * Identity Hydration:
 * - Auth proves WHO the user is (token)
 * - Profile stores WHO they say they are (name, college, etc.)
 * - /me endpoint hydrates both on app launch
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";
import { api } from "../services/api";

interface UserState {
  // State
  user: User | null;
  email: string;
  name: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean; // Track if /me has been called

  // Actions
  setUser: (user: User) => void;
  setEmail: (email: string) => void;
  setName: (name: string) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  hydrateUser: () => Promise<void>; // Fetch /me and update state
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      email: "",
      name: "",
      isAuthenticated: false,
      isLoading: true,
      isHydrated: false,

      // Set user (after login)
      setUser: (user) =>
        set({
          user,
          name: user.name || "",
          isAuthenticated: true,
          isLoading: false,
        }),

      // Set email (before verification)
      setEmail: (email) =>
        set({
          email,
        }),

      // Set name (during onboarding)
      setName: (name) =>
        set({
          name,
        }),

      // Clear user (logout)
      clearUser: () =>
        set({
          user: null,
          email: "",
          name: "",
          isAuthenticated: false,
          isLoading: false,
          isHydrated: false,
        }),

      // Set loading state
      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      // Update user properties
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
          name: updates.name || state.name,
        })),

      // Hydrate user from /me endpoint
      // Call this on app launch when user is authenticated
      hydrateUser: async () => {
        try {
          const response = await api.get<{
            success: boolean;
            data: {
              id: string;
              email: string;
              name: string | null;
              avatar: string | null;
              college: string | null;
              course: string | null;
              year: number | null;
              goals: string[];
              jrScore: number;
              topRole: string | null;
              onboardingCompleted: boolean;
              emailVerified: boolean;
            };
          }>("/user/me");

          if (response.success && response.data?.data) {
            const userData = response.data.data;
            set((state) => ({
              user: state.user
                ? {
                    ...state.user,
                    name: userData.name || state.user.name,
                    avatar: userData.avatar || state.user.avatar,
                    college: userData.college,
                    course: userData.course,
                    year: userData.year,
                    goals: userData.goals,
                    jrScore: userData.jrScore,
                    topRole: userData.topRole,
                    onboardingCompleted: userData.onboardingCompleted,
                    emailVerified: userData.emailVerified,
                  }
                : null,
              name: userData.name || state.name,
              isHydrated: true,
            }));
          }
        } catch (error) {
          console.error("Failed to hydrate user:", error);
          // Don't block the app, just mark as hydrated
          set({ isHydrated: true });
        }
      },
    }),
    {
      name: "exoptus-user-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user data, not loading state
      partialize: (state) => ({
        user: state.user,
        email: state.email,
        name: state.name,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useUserStore;
