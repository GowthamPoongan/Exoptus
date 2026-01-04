/**
 * useOnboardingChat Hook
 *
 * Orchestrates the onboarding chat flow.
 * Owns: API calls, step advancement, store updates.
 * Returns: messages, currentStep, submitAnswer(), loading, error.
 *
 * chat.tsx MUST NOT:
 * - Decide next step
 * - Validate answers
 * - Generate analysis
 * - Track progress math
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useOnboardingStore } from "../../store/onboardingStore";
import { useUserStore } from "../../store/userStore";
import { api } from "../../services/api";

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  type: "system" | "user";
  content: string;
  timestamp: number;
  isTyping?: boolean;
}

export type InputType =
  | "text"
  | "chips"
  | "multi-chips"
  | "numeric"
  | "location"
  | "file"
  | "selector"
  | "role-cards"
  | "consent"
  | "none";

export interface ConversationStep {
  id: string;
  messages: string[];
  inputType: InputType;
  options?: string[];
  multiSelect?: boolean;
  fileType?: "resume" | "id";
  selectorType?: "age" | "semester" | "year" | "course";
  confidenceWeight: number;
  nextStep: string | null;
  validator?: string; // Validator name, backend resolves
  isOptional?: boolean;
}

export interface OnboardingFlow {
  steps: Record<string, ConversationStep>;
  totalSteps: number;
  initialStep: string;
}

export interface UserOnboardingData {
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
  resume: any;
  officeId: any;
  careerAspiration: string;
  selectedRole: any;
}

interface UseOnboardingChatReturn {
  // State
  messages: ChatMessage[];
  currentStep: ConversationStep | null;
  currentStepId: string;
  userData: UserOnboardingData;
  progress: number;
  isTyping: boolean;
  showInput: boolean;

  // Loading/Error states
  isLoading: boolean;
  isFlowLoading: boolean;
  error: string | null;

  // Actions
  submitAnswer: (answer: any, displayText?: string) => Promise<void>;
  retryFlow: () => void;
}

// ============================================================================
// FALLBACK FLOW (Used when backend is unavailable)
// Will be removed once backend is stable
// ============================================================================

const FALLBACK_FLOW: OnboardingFlow = {
  initialStep: "intro",
  totalSteps: 14,
  steps: {
    intro: {
      id: "intro",
      messages: [
        "Hey there! 👋",
        "I'm Odyssey, your career companion.",
        "Before we begin, I need to know a few things.",
      ],
      inputType: "none",
      confidenceWeight: 0,
      nextStep: "ask_name",
    },
    ask_name: {
      id: "ask_name",
      messages: ["What should I call you?"],
      inputType: "text",
      confidenceWeight: 5,
      nextStep: "greet_name",
      validator: "name",
    },
    greet_name: {
      id: "greet_name",
      messages: ["Nice to meet you, {name}! ✨"],
      inputType: "none",
      confidenceWeight: 0,
      nextStep: "consent",
    },
    consent: {
      id: "consent",
      messages: [
        "Before we continue, I need your consent to personalize your experience.",
        "Your data helps me give you better recommendations.",
      ],
      inputType: "consent",
      confidenceWeight: 5,
      nextStep: "consent_accepted",
    },
    consent_accepted: {
      id: "consent_accepted",
      messages: [
        "Thank you for trusting me! 🙏",
        "You stay in control. Delete your data anytime from Settings.",
        "Now, let me ask you a few questions to understand you better.",
      ],
      inputType: "none",
      confidenceWeight: 0,
      nextStep: "ask_status",
    },
    ask_status: {
      id: "ask_status",
      messages: ["What best describes you right now?"],
      inputType: "chips",
      options: ["Student", "Graduate", "Working"],
      confidenceWeight: 10,
      nextStep: "ask_gender",
    },
    ask_gender: {
      id: "ask_gender",
      messages: ["What is your gender?"],
      inputType: "chips",
      options: ["Male", "Female", "Other", "Prefer not to say"],
      confidenceWeight: 8,
      nextStep: "ask_age",
    },
    ask_age: {
      id: "ask_age",
      messages: ["How old are you?"],
      inputType: "numeric",
      confidenceWeight: 8,
      validator: "age",
      nextStep: "ask_location",
    },
    ask_location: {
      id: "ask_location",
      messages: ["Where are you currently located?"],
      inputType: "location",
      confidenceWeight: 8,
      nextStep: "branch_by_status", // Special: resolved by getNextStep
    },
    // Student flow
    student_college: {
      id: "student_college",
      messages: ["Which college are you currently studying in?"],
      inputType: "text",
      confidenceWeight: 10,
      nextStep: "student_course",
    },
    student_course: {
      id: "student_course",
      messages: ["What course and stream are you pursuing?"],
      inputType: "text",
      confidenceWeight: 10,
      nextStep: "student_semester",
    },
    student_semester: {
      id: "student_semester",
      messages: ["Which semester are you currently in?"],
      inputType: "numeric",
      confidenceWeight: 8,
      validator: "semester",
      nextStep: "student_subjects",
    },
    student_subjects: {
      id: "student_subjects",
      messages: ["Which subjects are you familiar with?"],
      inputType: "multi-chips",
      options: [
        "Python",
        "Java",
        "C++",
        "JavaScript",
        "Data Structures",
        "Algorithms",
        "Web Development",
        "Mobile Development",
        "Machine Learning",
        "AI",
        "Database",
        "Cloud Computing",
      ],
      multiSelect: true,
      confidenceWeight: 10,
      nextStep: "student_cgpa",
    },
    student_cgpa: {
      id: "student_cgpa",
      messages: ["What is your current CGPA?"],
      inputType: "numeric",
      confidenceWeight: 8,
      validator: "cgpa",
      nextStep: "student_aspiration",
    },
    student_aspiration: {
      id: "student_aspiration",
      messages: ["What would you like to become?"],
      inputType: "chips",
      options: [
        "Software Engineer",
        "Data Scientist",
        "Product Manager",
        "Designer",
        "Business Analyst",
        "DevOps Engineer",
      ],
      confidenceWeight: 10,
      nextStep: "role_selection",
    },
    // Graduate flow
    graduate_college: {
      id: "graduate_college",
      messages: ["Which college did you study in?"],
      inputType: "text",
      confidenceWeight: 10,
      nextStep: "graduate_course",
    },
    graduate_course: {
      id: "graduate_course",
      messages: ["What course and stream did you complete?"],
      inputType: "text",
      confidenceWeight: 10,
      nextStep: "graduate_passout",
    },
    graduate_passout: {
      id: "graduate_passout",
      messages: ["Which year did you graduate?"],
      inputType: "numeric",
      confidenceWeight: 8,
      validator: "year",
      nextStep: "graduate_subjects",
    },
    graduate_subjects: {
      id: "graduate_subjects",
      messages: ["Which subjects are you familiar with?"],
      inputType: "multi-chips",
      options: [
        "Python",
        "Java",
        "C++",
        "JavaScript",
        "Data Structures",
        "Algorithms",
        "Web Development",
        "Mobile Development",
        "Machine Learning",
        "AI",
        "Database",
        "Cloud Computing",
      ],
      multiSelect: true,
      confidenceWeight: 10,
      nextStep: "graduate_cgpa",
    },
    graduate_cgpa: {
      id: "graduate_cgpa",
      messages: ["What was your final CGPA?"],
      inputType: "numeric",
      confidenceWeight: 8,
      validator: "cgpa",
      nextStep: "graduate_resume",
    },
    graduate_resume: {
      id: "graduate_resume",
      messages: ["Upload your resume so we can analyze your profile."],
      inputType: "file",
      fileType: "resume",
      confidenceWeight: 12,
      nextStep: "graduate_aspiration",
    },
    graduate_aspiration: {
      id: "graduate_aspiration",
      messages: ["What would you like to become next?"],
      inputType: "chips",
      options: [
        "Software Engineer",
        "Data Scientist",
        "Product Manager",
        "Designer",
        "Business Analyst",
        "DevOps Engineer",
      ],
      confidenceWeight: 10,
      nextStep: "role_selection",
    },
    // Working flow
    working_resume: {
      id: "working_resume",
      messages: ["Upload your resume so we can understand your experience."],
      inputType: "file",
      fileType: "resume",
      confidenceWeight: 15,
      nextStep: "working_office_id",
    },
    working_office_id: {
      id: "working_office_id",
      messages: [
        "Upload your office ID to get verified as a working professional.",
        "(This is optional but helps us verify your profile)",
      ],
      inputType: "file",
      fileType: "id",
      isOptional: true,
      confidenceWeight: 5,
      nextStep: "working_upgrade_goal",
    },
    working_upgrade_goal: {
      id: "working_upgrade_goal",
      messages: ["Which career or role would you like to upgrade to?"],
      inputType: "chips",
      options: [
        "Senior Engineer",
        "Lead Engineer",
        "Engineering Manager",
        "Product Manager",
        "Solution Architect",
        "CTO",
      ],
      confidenceWeight: 12,
      nextStep: "role_selection",
    },
    // Common final steps
    role_selection: {
      id: "role_selection",
      messages: ["Based on your interest, choose a role you're curious about."],
      inputType: "role-cards",
      confidenceWeight: 15,
      nextStep: "analysis",
    },
    analysis: {
      id: "analysis",
      messages: [
        "We're analyzing how your current knowledge matches industry expectations",
        "and estimating the time needed to build a custom plan for you...",
      ],
      inputType: "none",
      confidenceWeight: 13,
      nextStep: "complete",
    },
    complete: {
      id: "complete",
      messages: [
        "Amazing! I have everything I need. 🎯",
        "Welcome to Exoptus, where education meets direction. 🚀",
      ],
      inputType: "none",
      confidenceWeight: 0,
      nextStep: null,
    },
  },
};

// ============================================================================
// VALIDATORS (Frontend validation before API call)
// ============================================================================

const validators: Record<string, (value: any) => boolean> = {
  name: (name) => typeof name === "string" && name.trim().length >= 2,
  age: (age) => typeof age === "number" && age >= 15 && age <= 100,
  semester: (sem) => typeof sem === "number" && sem >= 1 && sem <= 12,
  cgpa: (cgpa) => typeof cgpa === "number" && cgpa >= 0 && cgpa <= 10,
  year: (year) => typeof year === "number" && year >= 1990 && year <= 2030,
};

// ============================================================================
// HOOK
// ============================================================================

export function useOnboardingChat(): UseOnboardingChatReturn {
  // Store connections
  const {
    messages: storedMessages,
    currentQuestionId,
    answers,
    progress: storedProgress,
    setCurrentQuestion,
    addAnswer,
    addMessage,
    setProgress,
    setCareerAnalysis,
    completeOnboarding,
  } = useOnboardingStore();

  const { name: userName, setName: storeSetName } = useUserStore();

  // Local state
  const [flow, setFlow] = useState<OnboardingFlow | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string>("intro");
  const [userData, setUserData] = useState<UserOnboardingData>({
    name: userName || "",
    status: null,
    gender: "",
    age: null,
    state: "",
    city: "",
    college: "",
    course: "",
    stream: "",
    semester: null,
    passoutYear: null,
    subjects: [],
    cgpa: null,
    resume: null,
    officeId: null,
    careerAspiration: "",
    selectedRole: null,
  });
  const [progress, setLocalProgress] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);

  // Loading/Error states
  const [isLoading, setIsLoading] = useState(false);
  const [isFlowLoading, setIsFlowLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track answered count for progress
  const answeredCountRef = useRef(0);
  const isInitializedRef = useRef(false);

  // ============================================================================
  // FETCH FLOW FROM BACKEND (with fallback)
  // ============================================================================

  const fetchFlow = useCallback(async () => {
    setIsFlowLoading(true);
    setError(null);

    try {
      const response = await api.get<{ flow: OnboardingFlow }>(
        "/onboarding/flow"
      );

      if (response.success && response.data?.flow) {
        setFlow(response.data.flow);
      } else {
        // Backend not available, use fallback
        console.log("Using fallback flow (backend unavailable)");
        setFlow(FALLBACK_FLOW);
      }
    } catch (err) {
      console.log("Using fallback flow (error):", err);
      setFlow(FALLBACK_FLOW);
    } finally {
      setIsFlowLoading(false);
    }
  }, []);

  // ============================================================================
  // RESTORE STATE FROM STORE (Resume capability)
  // ============================================================================

  const restoreState = useCallback(() => {
    if (storedMessages.length > 0 && currentQuestionId) {
      // Restore messages from store
      setMessages(
        storedMessages.map((m) => ({
          ...m,
          timestamp:
            typeof m.timestamp === "string"
              ? new Date(m.timestamp).getTime()
              : m.timestamp,
        })) as ChatMessage[]
      );
      setCurrentStepId(currentQuestionId);
      setLocalProgress(storedProgress);

      // Restore userData from answers
      const restoredUserData = { ...userData };
      answers.forEach((answer) => {
        const { questionId, answer: value } = answer;
        switch (questionId) {
          case "ask_name":
            restoredUserData.name = value as string;
            break;
          case "ask_status":
            restoredUserData.status = value as any;
            break;
          case "ask_gender":
            restoredUserData.gender = value as string;
            break;
          case "ask_age":
            restoredUserData.age = value as number;
            break;
          // ... restore other fields
        }
      });
      setUserData(restoredUserData);
      answeredCountRef.current = answers.length;

      return true;
    }
    return false;
  }, [storedMessages, currentQuestionId, storedProgress, answers, userData]);

  // ============================================================================
  // ADD SYSTEM MESSAGES WITH TYPING ANIMATION
  // ============================================================================

  const addSystemMessages = useCallback(
    async (texts: string[]) => {
      setIsTyping(true);

      for (let i = 0; i < texts.length; i++) {
        // Show typing indicator
        const typingId = `typing-${Date.now()}-${i}`;
        const typingMessage: ChatMessage = {
          id: typingId,
          type: "system",
          content: "",
          timestamp: Date.now(),
          isTyping: true,
        };

        setMessages((prev) => [...prev, typingMessage]);

        // Premium typing delay: 800-1200ms
        await new Promise((resolve) =>
          setTimeout(resolve, 800 + Math.random() * 400)
        );

        // Replace typing with actual message
        let content = texts[i];
        if (content.includes("{name}")) {
          content = content.replace("{name}", userData.name || "there");
        }

        const finalMessage: ChatMessage = {
          id: typingId,
          type: "system",
          content,
          timestamp: Date.now(),
          isTyping: false,
        };

        setMessages((prev) =>
          prev.map((msg) => (msg.id === typingId ? finalMessage : msg))
        );

        // Persist to store
        addMessage({
          id: typingId,
          type: "system",
          content,
          timestamp: new Date().toISOString(),
        });

        // Pause between messages
        if (i < texts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
      }

      setIsTyping(false);
    },
    [userData.name, addMessage]
  );

  // ============================================================================
  // GET NEXT STEP (handles branching)
  // ============================================================================

  const getNextStep = useCallback(
    (currentId: string, answer: any): string | null => {
      if (!flow) return null;

      const step = flow.steps[currentId];
      if (!step) return null;

      // Handle branching for location step
      if (currentId === "ask_location") {
        if (userData.status === "Student") return "student_college";
        if (userData.status === "Graduate") return "graduate_college";
        return "working_resume";
      }

      return step.nextStep;
    },
    [flow, userData.status]
  );

  // ============================================================================
  // PROCESS STEP
  // ============================================================================

  const processStep = useCallback(
    async (stepId: string) => {
      if (!flow) return;

      const step = flow.steps[stepId];
      if (!step) {
        // Flow complete
        completeOnboarding();
        return;
      }

      setCurrentStepId(stepId);
      setCurrentQuestion(stepId);
      setShowInput(false);

      // Add system messages
      if (step.messages.length > 0) {
        await addSystemMessages(step.messages);
      }

      // Handle auto-advance steps
      if (step.inputType === "none") {
        const nextStepId = getNextStep(stepId, null);
        if (nextStepId) {
          setTimeout(() => {
            processStep(nextStepId);
          }, 1000);
        } else {
          // Onboarding complete - trigger analysis
          await triggerAnalysis();
        }
      } else {
        setShowInput(true);
      }
    },
    [
      flow,
      addSystemMessages,
      getNextStep,
      setCurrentQuestion,
      completeOnboarding,
    ]
  );

  // ============================================================================
  // TRIGGER CAREER ANALYSIS
  // ============================================================================

  const triggerAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<{ analysis: any }>(
        "/onboarding/analyze",
        {
          userData,
          answers,
        }
      );

      if (response.success && response.data?.analysis) {
        setCareerAnalysis(response.data.analysis);
      } else {
        // Fallback analysis if backend fails
        const fallbackAnalysis = {
          skills: [
            { name: "Technical Skills", userLevel: 0.65, industryAvg: 0.75 },
            { name: "Communication", userLevel: 0.78, industryAvg: 0.7 },
            { name: "Problem Solving", userLevel: 0.72, industryAvg: 0.68 },
            { name: "Domain Knowledge", userLevel: 0.58, industryAvg: 0.72 },
          ],
          growthProjection: [
            { month: 0, readiness: 0.45 },
            { month: 3, readiness: 0.62 },
            { month: 6, readiness: 0.78 },
            { month: 9, readiness: 0.88 },
            { month: 12, readiness: 0.95 },
          ],
          strengths: [
            "Strong academic foundation",
            "Natural communication ability",
          ],
          focusAreas: [
            "Industry-specific tools",
            "Real-world project experience",
          ],
          readinessTimeline: "9-12 months",
          generatedAt: new Date().toISOString(),
        };
        setCareerAnalysis(fallbackAnalysis);
      }

      completeOnboarding();
    } catch (err: any) {
      setError(err.message || "Failed to analyze career data");
      // Still complete with fallback
      completeOnboarding();
    } finally {
      setIsLoading(false);
    }
  }, [userData, answers, setCareerAnalysis, completeOnboarding]);

  // ============================================================================
  // SUBMIT ANSWER
  // ============================================================================

  const submitAnswer = useCallback(
    async (answer: any, displayText?: string) => {
      if (!flow) return;

      const step = flow.steps[currentStepId];
      if (!step) return;

      setIsLoading(true);
      setError(null);

      try {
        // Frontend validation
        if (step.validator && validators[step.validator]) {
          if (!validators[step.validator](answer)) {
            await addSystemMessages(["Please provide a valid answer."]);
            setIsLoading(false);
            return;
          }
        }

        // Update userData
        const updatedUserData = { ...userData };
        let responseDisplay = displayText || String(answer);

        switch (currentStepId) {
          case "ask_name":
            const trimmedName = String(answer).trim();
            updatedUserData.name = trimmedName;
            storeSetName(trimmedName);
            break;
          case "ask_status":
            updatedUserData.status = answer;
            break;
          case "ask_gender":
            updatedUserData.gender = answer;
            break;
          case "ask_age":
            updatedUserData.age = answer;
            responseDisplay = `${answer} years old`;
            break;
          case "ask_location":
            if (typeof answer === "object") {
              updatedUserData.state = answer.state;
              updatedUserData.city = answer.city;
              responseDisplay = `${answer.city}, ${answer.state}`;
            }
            break;
          case "student_college":
          case "graduate_college":
            updatedUserData.college = answer;
            break;
          case "student_course":
          case "graduate_course":
            updatedUserData.course = answer;
            break;
          case "student_semester":
            updatedUserData.semester = answer;
            responseDisplay = `Semester ${answer}`;
            break;
          case "graduate_passout":
            updatedUserData.passoutYear = answer;
            break;
          case "student_subjects":
          case "graduate_subjects":
            updatedUserData.subjects = answer;
            responseDisplay = Array.isArray(answer)
              ? answer.join(", ")
              : answer;
            break;
          case "student_cgpa":
          case "graduate_cgpa":
            updatedUserData.cgpa = parseFloat(answer);
            responseDisplay = `CGPA: ${answer}`;
            break;
          case "graduate_resume":
          case "working_resume":
            updatedUserData.resume = answer;
            responseDisplay = answer?.name || "Resume uploaded";
            break;
          case "working_office_id":
            updatedUserData.officeId = answer;
            responseDisplay = answer ? answer.name : "Skipped";
            break;
          case "student_aspiration":
          case "graduate_aspiration":
          case "working_upgrade_goal":
            updatedUserData.careerAspiration = answer;
            break;
          case "role_selection":
            updatedUserData.selectedRole = answer;
            responseDisplay = answer?.title || answer;
            break;
        }

        setUserData(updatedUserData);

        // Add user message
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          type: "user",
          content: responseDisplay,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Persist to store
        addMessage({
          id: userMessage.id,
          type: "user",
          content: responseDisplay,
          timestamp: new Date().toISOString(),
        });

        // Store answer
        addAnswer({
          questionId: currentStepId,
          answer,
          timestamp: new Date().toISOString(),
        });

        // Update progress
        answeredCountRef.current += 1;
        const newProgress = Math.min(
          100,
          (answeredCountRef.current / (flow.totalSteps || 14)) * 100
        );
        setLocalProgress(newProgress);
        setProgress(newProgress);

        // Hide input and process next step
        setShowInput(false);

        setTimeout(() => {
          const nextStepId = getNextStep(currentStepId, answer);
          if (nextStepId) {
            processStep(nextStepId);
          } else {
            triggerAnalysis();
          }
        }, 400);
      } catch (err: any) {
        setError(err.message || "Failed to submit answer");
      } finally {
        setIsLoading(false);
      }
    },
    [
      flow,
      currentStepId,
      userData,
      addSystemMessages,
      storeSetName,
      addMessage,
      addAnswer,
      setProgress,
      getNextStep,
      processStep,
      triggerAnalysis,
    ]
  );

  // ============================================================================
  // RETRY FLOW
  // ============================================================================

  const retryFlow = useCallback(() => {
    setError(null);
    fetchFlow();
  }, [fetchFlow]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      fetchFlow();
    }
  }, [fetchFlow]);

  // Start flow when loaded
  useEffect(() => {
    if (flow && !isFlowLoading) {
      // Try to restore state first
      const restored = restoreState();

      if (!restored) {
        // Fresh start
        setTimeout(() => {
          processStep(flow.initialStep);
        }, 800);
      } else {
        // Resume - show input for current step
        setShowInput(true);
      }
    }
  }, [flow, isFlowLoading, restoreState, processStep]);

  // ============================================================================
  // RETURN
  // ============================================================================

  const currentStep = flow?.steps[currentStepId] || null;

  return {
    messages,
    currentStep,
    currentStepId,
    userData,
    progress,
    isTyping,
    showInput,
    isLoading,
    isFlowLoading,
    error,
    submitAnswer,
    retryFlow,
  };
}

export default useOnboardingChat;
