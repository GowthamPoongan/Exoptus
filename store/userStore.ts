/**
 * User Store
 *
 * Global state management for user data using Zustand.
 * Persists user session across app restarts.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";

interface UserState {
  // State
  user: User | null;
  email: string;
  name: string;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setEmail: (email: string) => void;
  setName: (name: string) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
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

      // Set user (after login)
      setUser: (user) =>
        set({
          user,
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
        })),
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
