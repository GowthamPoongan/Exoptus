/**
 * Onboarding Store
 *
 * Manages the conversational onboarding flow state.
 * Tracks progress, answers, and current position.
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

  // Actions
  setCurrentQuestion: (questionId: string) => void;
  addAnswer: (answer: OnboardingAnswer) => void;
  addMessage: (message: ChatMessage) => void;
  setProgress: (progress: number) => void;
  setCareerAnalysis: (analysis: CareerAnalysis) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

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
        }),
    }),
    {
      name: "exoptus-onboarding-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useOnboardingStore;
