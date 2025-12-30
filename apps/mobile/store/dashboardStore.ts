/**
 * Dashboard Store
 *
 * Global state management for dashboard data using Zustand.
 * Handles JR Score, tasks, roadmap progress, and UI state.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  timestamp: Date;
  type:
    | "info"
    | "success"
    | "warning"
    | "action"
    | "achievement"
    | "reminder"
    | "update"
    | "tip";
}

interface DashboardState {
  // JR Score
  jrScore: number;
  jrScoreHistory: { date: string; score: number }[];

  // Profile completion
  profileSteps: ProfileStep[];
  currentProfileStep: number;

  // Tasks
  tasks: Task[];

  // Roadmap
  roadmapLevels: RoadmapLevel[];

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // UI State
  isCalendarOpen: boolean;
  selectedDate: string;
  activeTab: string;

  // Actions
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
    notification: Omit<Notification, "id" | "createdAt" | "timestamp">
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  setCalendarOpen: (open: boolean) => void;
  setSelectedDate: (date: string) => void;
  setActiveTab: (tab: string) => void;
}

// Default profile steps
const defaultProfileSteps: ProfileStep[] = [
  { id: "basic_info", label: "Basic Info", completed: true },
  { id: "education", label: "Education", completed: true },
  { id: "skills", label: "Skills", completed: true },
  { id: "summary", label: "Writing summary...", completed: false },
  { id: "preferences", label: "Preferences", completed: false },
];

// Default roadmap levels
const defaultRoadmapLevels: RoadmapLevel[] = [
  {
    id: "foundation",
    title: "Foundation",
    description: "Build your core skills and understanding",
    status: "in_progress",
    order: 1,
    items: [
      {
        id: "f1",
        title: "Complete profile assessment",
        description: "Help us understand your current skills and goals",
        effort: "low",
        skillImpact: 3,
        completed: true,
      },
      {
        id: "f2",
        title: "Set career goals",
        description: "Define where you want to be in 1-3 years",
        effort: "medium",
        skillImpact: 5,
        completed: true,
      },
      {
        id: "f3",
        title: "Identify skill gaps",
        description: "Understand what you need to learn",
        effort: "low",
        skillImpact: 4,
        completed: false,
      },
    ],
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "Develop practical experience and portfolio",
    status: "locked",
    order: 2,
    items: [
      {
        id: "i1",
        title: "Build first project",
        description: "Create a portfolio-worthy project",
        effort: "high",
        skillImpact: 8,
        completed: false,
      },
      {
        id: "i2",
        title: "Learn industry tools",
        description: "Master tools used in your target role",
        effort: "medium",
        skillImpact: 6,
        completed: false,
      },
    ],
  },
  {
    id: "industry_ready",
    title: "Industry Ready",
    description: "Prepare for real job applications",
    status: "locked",
    order: 3,
    items: [
      {
        id: "ir1",
        title: "Optimize resume",
        description: "Create an ATS-friendly resume",
        effort: "medium",
        skillImpact: 7,
        completed: false,
      },
      {
        id: "ir2",
        title: "Practice interviews",
        description: "Mock interviews and preparation",
        effort: "high",
        skillImpact: 9,
        completed: false,
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Stand out from the competition",
    status: "locked",
    order: 4,
    items: [
      {
        id: "a1",
        title: "Build online presence",
        description: "LinkedIn, portfolio, GitHub optimization",
        effort: "medium",
        skillImpact: 6,
        completed: false,
      },
      {
        id: "a2",
        title: "Network strategically",
        description: "Connect with industry professionals",
        effort: "high",
        skillImpact: 8,
        completed: false,
      },
    ],
  },
];

// Sample notifications
const defaultNotifications: Notification[] = [
  {
    id: "1",
    title: "Welcome to Exoptus!",
    message:
      "Your career journey begins here. Complete your profile to get personalized recommendations.",
    read: false,
    createdAt: new Date().toISOString(),
    timestamp: new Date(),
    type: "info",
  },
  {
    id: "2",
    title: "New skill assessment available",
    message: "Take the quick assessment to update your JR Score.",
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    timestamp: new Date(Date.now() - 3600000),
    type: "action",
  },
  {
    id: "3",
    title: "Profile 60% complete",
    message: "Add your education details to unlock more features.",
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    timestamp: new Date(Date.now() - 86400000),
    type: "reminder",
  },
  {
    id: "4",
    title: "JR Score improved!",
    message: "Your JR Score increased by 5 points this week. Great progress!",
    read: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    timestamp: new Date(Date.now() - 172800000),
    type: "achievement",
  },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      jrScore: 78,
      jrScoreHistory: [
        { date: "2025-12-20", score: 65 },
        { date: "2025-12-21", score: 68 },
        { date: "2025-12-22", score: 72 },
        { date: "2025-12-23", score: 74 },
        { date: "2025-12-24", score: 76 },
        { date: "2025-12-25", score: 78 },
      ],
      profileSteps: defaultProfileSteps,
      currentProfileStep: 3,
      tasks: [],
      roadmapLevels: defaultRoadmapLevels,
      notifications: defaultNotifications,
      unreadCount: 2,
      isCalendarOpen: false,
      selectedDate: new Date().toISOString().split("T")[0],
      activeTab: "home",

      // Actions
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
              timestamp: new Date(),
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

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
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
      }),
    }
  )
);

export default useDashboardStore;
