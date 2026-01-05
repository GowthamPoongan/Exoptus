/**
 * Dashboard Store
 *
 * Global state management for dashboard data using Zustand.
 * Handles JR Score, tasks, roadmap progress, and UI state.
 *
 * PHASE 2: Store mirrors API state, not defaults.
 * - fetchDashboard() loads data from backend
 * - No more hardcoded mock data
 * - Store acts as cache for API responses
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

// Types
export interface Task {
  id: string;
  title: string;
  emoji: string;
  completed: boolean;
  date: string; // ISO date string
  createdAt: string;
}

export interface RoadmapLevel {
  id: string;
  title: string;
  description: string;
  status: "locked" | "in_progress" | "completed";
  order: number;
  items: RoadmapItem[];
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  effort: "low" | "medium" | "high";
  skillImpact: number; // 1-10
  completed: boolean;
}

export interface ProfileStep {
  id: string;
  label: string;
  completed: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: "info" | "success" | "warning" | "action";
}

interface DashboardState {
  // Data from API
  jrScore: number;
  jrScoreHistory: { date: string; score: number }[];
  profileSteps: ProfileStep[];
  currentProfileStep: number;
  tasks: Task[];
  roadmapLevels: RoadmapLevel[];
  notifications: Notification[];
  unreadCount: number;

  // PHASE 3: Core dashboard data from /user/dashboard
  topRole: string | null;
  topRoleMatch: number | null;
  profileCompletion: number;
  missingSkills: string[];
  estimatedMonths: number | null;

  // Loading/Error states (PHASE 2 requirement)
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;

  // UI State
  isCalendarOpen: boolean;
  selectedDate: string;
  activeTab: string;

  // API Actions
  fetchDashboard: () => Promise<void>;
  fetchUserDashboard: () => Promise<void>; // PHASE 3: Simple dashboard fetch
  refreshDashboard: () => Promise<void>;

  // Local Actions
  setJRScore: (score: number) => void;
  addJRScoreHistory: (score: number) => void;
  setProfileSteps: (steps: ProfileStep[]) => void;
  completeProfileStep: (stepId: string) => void;
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setRoadmapLevels: (levels: RoadmapLevel[]) => void;
  completeRoadmapItem: (levelId: string, itemId: string) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt">
  ) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setCalendarOpen: (open: boolean) => void;
  setSelectedDate: (date: string) => void;
  setActiveTab: (tab: string) => void;
}

// Default empty state (no mock data)
const emptyProfileSteps: ProfileStep[] = [];
const emptyRoadmapLevels: RoadmapLevel[] = [];
const emptyNotifications: Notification[] = [];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial state - empty until API loads
      jrScore: 0,
      jrScoreHistory: [],
      profileSteps: emptyProfileSteps,
      currentProfileStep: 0,
      tasks: [],
      roadmapLevels: emptyRoadmapLevels,
      notifications: emptyNotifications,
      unreadCount: 0,

      // PHASE 3: Core dashboard data
      topRole: null,
      topRoleMatch: null,
      profileCompletion: 0,
      missingSkills: [],
      estimatedMonths: null,

      // Loading/Error states
      isLoading: false,
      error: null,
      lastFetched: null,

      // UI State
      isCalendarOpen: false,
      selectedDate: new Date().toISOString().split("T")[0],
      activeTab: "home",

      // ============================================
      // API ACTIONS
      // ============================================

      fetchDashboard: async () => {
        // Skip if already loading
        if (get().isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const response = await api.get<{
            data: {
              jrScore: number;
              jrScoreHistory: { date: string; score: number }[];
              profileSteps: ProfileStep[];
              currentProfileStep: number;
              roadmapLevels: RoadmapLevel[];
              notifications: Notification[];
              tasks: Task[];
            };
          }>("/dashboard");

          if (response.success && response.data?.data) {
            const data = response.data.data;
            set({
              jrScore: data.jrScore,
              jrScoreHistory: data.jrScoreHistory,
              profileSteps: data.profileSteps,
              currentProfileStep: data.currentProfileStep,
              roadmapLevels: data.roadmapLevels,
              notifications: data.notifications,
              unreadCount: data.notifications.filter((n) => !n.read).length,
              tasks: data.tasks || [],
              isLoading: false,
              lastFetched: new Date().toISOString(),
            });
          } else {
            set({
              isLoading: false,
              error: response.error || "Failed to fetch dashboard",
            });
          }
        } catch (err: any) {
          console.error("Dashboard fetch error:", err);
          set({
            isLoading: false,
            error: err.message || "Network error",
          });
        }
      },

      refreshDashboard: async () => {
        // Force refresh even if recently fetched
        set({ lastFetched: null });
        await get().fetchDashboard();
      },

      // PHASE 3: Simple dashboard fetch from /user/dashboard
      // Returns: jrScore, topRole, profileCompletion - proving data flow
      fetchUserDashboard: async () => {
        if (get().isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const response = await api.get<{
            data: {
              jrScore: number;
              topRole: string | null;
              topRoleMatch: number | null;
              profileCompletion: number;
              missingSkills: string[];
              estimatedMonths: number | null;
            };
          }>("/user/dashboard");

          if (response.success && response.data?.data) {
            const data = response.data.data;
            set({
              jrScore: data.jrScore,
              topRole: data.topRole,
              topRoleMatch: data.topRoleMatch,
              profileCompletion: data.profileCompletion,
              missingSkills: data.missingSkills,
              estimatedMonths: data.estimatedMonths,
              isLoading: false,
              lastFetched: new Date().toISOString(),
            });
          } else {
            set({
              isLoading: false,
              error: response.error || "Failed to fetch user dashboard",
            });
          }
        } catch (err: any) {
          console.error("User dashboard fetch error:", err);
          set({
            isLoading: false,
            error: err.message || "Network error",
          });
        }
      },

      // ============================================
      // LOCAL ACTIONS (for UI optimistic updates)
      // ============================================

      setJRScore: (score) => set({ jrScore: score }),

      addJRScoreHistory: (score) =>
        set((state) => ({
          jrScoreHistory: [
            ...state.jrScoreHistory,
            { date: new Date().toISOString().split("T")[0], score },
          ],
        })),

      setProfileSteps: (steps) => set({ profileSteps: steps }),

      completeProfileStep: (stepId) =>
        set((state) => ({
          profileSteps: state.profileSteps.map((step) =>
            step.id === stepId ? { ...step, completed: true } : step
          ),
          currentProfileStep: Math.min(
            state.currentProfileStep + 1,
            state.profileSteps.length - 1
          ),
        })),

      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          ),
        })),

      setRoadmapLevels: (levels) => set({ roadmapLevels: levels }),

      completeRoadmapItem: (levelId, itemId) =>
        set((state) => {
          const newLevels = state.roadmapLevels.map((level) => {
            if (level.id === levelId) {
              const newItems = level.items.map((item) =>
                item.id === itemId ? { ...item, completed: true } : item
              );
              const allCompleted = newItems.every((item) => item.completed);
              return {
                ...level,
                items: newItems,
                status: allCompleted ? "completed" : level.status,
              };
            }
            return level;
          });

          // Unlock next level if current is completed
          const completedIndex = newLevels.findIndex(
            (l) => l.id === levelId && l.status === "completed"
          );
          if (completedIndex !== -1 && completedIndex < newLevels.length - 1) {
            newLevels[completedIndex + 1].status = "in_progress";
          }

          return { roadmapLevels: newLevels as RoadmapLevel[] };
        }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            },
            ...state.notifications,
          ],
          unreadCount: state.unreadCount + 1,
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      clearNotifications: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),

      setCalendarOpen: (open) => set({ isCalendarOpen: open }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: "exoptus-dashboard-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        jrScore: state.jrScore,
        jrScoreHistory: state.jrScoreHistory,
        profileSteps: state.profileSteps,
        currentProfileStep: state.currentProfileStep,
        tasks: state.tasks,
        roadmapLevels: state.roadmapLevels,
        selectedDate: state.selectedDate,
        lastFetched: state.lastFetched,
      }),
    }
  )
);

export default useDashboardStore;
