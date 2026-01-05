/**
 * Onboarding Store
 *
 * Manages the conversational onboarding flow state.
 * Tracks progress, answers, and current position.
 *
 * PHASE 2: Source of truth for onboarding state.
 * - Persists to AsyncStorage for resume capability
 * - Messages and currentStep are persisted
 * - Frontend reads from this store, not local state
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingAnswer, ChatMessage, CareerAnalysis } from "../types";

interface OnboardingState {
  // State
  currentQuestionId: string | null;
  answers: OnboardingAnswer[];
  messages: ChatMessage[];
  progress: number; // 0-100
  isComplete: boolean;
  careerAnalysis: CareerAnalysis | null;

  // User data collected during onboarding (for resume capability)
  userData: {
    name: string;
    status: "Student" | "Graduate" | "Working" | null;
    gender: string;
    age: number | null;
    state: string;
    city: string;
    college: string;
    course: string;
    stream: string;
    semester: number | null;
    passoutYear: number | null;
    subjects: string[];
    cgpa: number | null;
    careerAspiration: string;
    selectedRole: any;
  };

  // Actions
  setCurrentQuestion: (questionId: string) => void;
  addAnswer: (answer: OnboardingAnswer) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setProgress: (progress: number) => void;
  setCareerAnalysis: (analysis: CareerAnalysis) => void;
  updateUserData: (data: Partial<OnboardingState["userData"]>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialUserData = {
  name: "",
  status: null as "Student" | "Graduate" | "Working" | null,
  gender: "",
  age: null as number | null,
  state: "",
  city: "",
  college: "",
  course: "",
  stream: "",
  semester: null as number | null,
  passoutYear: null as number | null,
  subjects: [] as string[],
  cgpa: null as number | null,
  careerAspiration: "",
  selectedRole: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentQuestionId: null,
      answers: [],
      messages: [],
      progress: 0,
      isComplete: false,
      careerAnalysis: null,
      userData: { ...initialUserData },

      // Set current question
      setCurrentQuestion: (questionId) =>
        set({
          currentQuestionId: questionId,
        }),

      // Add answer to history
      addAnswer: (answer) =>
        set((state) => ({
          answers: [...state.answers, answer],
        })),

      // Add message to chat
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      // Set all messages (for restore)
      setMessages: (messages) =>
        set({
          messages,
        }),

      // Update progress bar
      setProgress: (progress) =>
        set({
          progress: Math.min(100, Math.max(0, progress)),
        }),

      // Set career analysis results
      setCareerAnalysis: (analysis) =>
        set({
          careerAnalysis: analysis,
        }),

      // Update user data collected during onboarding
      updateUserData: (data) =>
        set((state) => ({
          userData: { ...state.userData, ...data },
        })),

      // Mark onboarding as complete
      completeOnboarding: () =>
        set({
          isComplete: true,
          progress: 100,
        }),

      // Reset for new user or retry
      resetOnboarding: () =>
        set({
          currentQuestionId: null,
          answers: [],
          messages: [],
          progress: 0,
          isComplete: false,
          careerAnalysis: null,
          userData: { ...initialUserData },
        }),
    }),
    {
      name: "exoptus-onboarding-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Persist all fields for resume capability
      partialize: (state) => ({
        currentQuestionId: state.currentQuestionId,
        answers: state.answers,
        messages: state.messages,
        progress: state.progress,
        isComplete: state.isComplete,
        careerAnalysis: state.careerAnalysis,
        userData: state.userData,
      }),
    }
  )
);

export default useOnboardingStore;
