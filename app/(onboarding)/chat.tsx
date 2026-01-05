import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  StyleSheet,
  Keyboard,
  Image,
  ImageBackground,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  FadeIn,
  FadeInLeft,
  FadeInRight,
} from "react-native-reanimated";
import * as DocumentPicker from "expo-document-picker";
import { useOnboardingStore } from "../../store/onboardingStore";
import { useUserStore } from "../../store/userStore";
import { api } from "../../services/api";

const { width, height } = Dimensions.get("window");

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  type: "system" | "user";
  content: string;
  timestamp: number;
  isTyping?: boolean;
}

type InputType =
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

interface ConversationStep {
  id: string;
  messages: string[];
  inputType: InputType;
  options?: string[];
  multiSelect?: boolean;
  fileType?: "resume" | "id";
  selectorType?: "age" | "semester" | "year" | "course";
  confidenceWeight: number;
  nextStep: string | ((answer: any, userData: any) => string);
  validator?: (answer: any) => boolean;
  isOptional?: boolean;
}

interface UserData {
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

// ============================================================================
// CONVERSATION FLOW - COMPREHENSIVE ONBOARDING SYSTEM
// ============================================================================

const CONVERSATION_FLOW: Record<string, ConversationStep> = {
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

  // Ask for name first
  ask_name: {
    id: "ask_name",
    messages: ["What should I call you?"],
    inputType: "text",
    confidenceWeight: 5,
    nextStep: "greet_name",
    validator: (name) => name.trim().length >= 2,
  },

  greet_name: {
    id: "greet_name",
    messages: ["Nice to meet you, {name}! ✨"],
    inputType: "none",
    confidenceWeight: 0,
    nextStep: "consent",
  },

  // CONSENT FORM - comes after name, before everything else
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

  // COMMON QUESTION 1: Current Status
  ask_status: {
    id: "ask_status",
    messages: ["What best describes you right now?"],
    inputType: "chips",
    options: ["Student", "Graduate", "Working"],
    confidenceWeight: 10,
    nextStep: "ask_gender",
  },

  // COMMON QUESTION 2: Gender
  ask_gender: {
    id: "ask_gender",
    messages: ["What is your gender?"],
    inputType: "chips",
    options: ["Male", "Female", "Other", "Prefer not to say"],
    confidenceWeight: 8,
    nextStep: "ask_age",
  },

  // COMMON QUESTION 3: Age (changed to numeric input)
  ask_age: {
    id: "ask_age",
    messages: ["How old are you?"],
    inputType: "numeric",
    confidenceWeight: 8,
    validator: (age) => age >= 15 && age <= 100,
    nextStep: "ask_location",
  },

  // COMMON QUESTION 4: Location
  ask_location: {
    id: "ask_location",
    messages: ["Where are you currently located?"],
    inputType: "location",
    confidenceWeight: 8,
    nextStep: (answer, userData) => {
      if (userData.status === "Student") return "student_college";
      if (userData.status === "Graduate") return "graduate_college";
      return "working_resume";
    },
  },

  // ========== STUDENT FLOW ==========
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
    validator: (sem) => sem >= 1 && sem <= 12,
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
    validator: (cgpa) => cgpa >= 0 && cgpa <= 10,
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
    nextStep: "student_role_selection",
  },

  student_role_selection: {
    id: "student_role_selection",
    messages: ["Based on your interest, choose a role you're curious about."],
    inputType: "role-cards",
    confidenceWeight: 15,
    nextStep: "analysis",
  },

  // ========== GRADUATE FLOW ==========
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
    validator: (year) => year >= 1990 && year <= 2030,
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
    validator: (cgpa) => cgpa >= 0 && cgpa <= 10,
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
    nextStep: "graduate_role_selection",
  },

  graduate_role_selection: {
    id: "graduate_role_selection",
    messages: ["Based on your interest, choose a role you're curious about."],
    inputType: "role-cards",
    confidenceWeight: 15,
    nextStep: "analysis",
  },

  // ========== WORKING PROFESSIONAL FLOW ==========
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
    nextStep: "working_role_selection",
  },

  working_role_selection: {
    id: "working_role_selection",
    messages: [
      "Based on your goal, here are roles that match your aspiration.",
    ],
    inputType: "role-cards",
    confidenceWeight: 15,
    nextStep: "analysis",
  },

  // ========== ANALYSIS PHASE ==========
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
    nextStep: "done",
  },
};

// FALLBACK ROLE DATA (used when API unavailable)
const FALLBACK_ROLE_CARDS = [
  {
    id: "role1",
    title: "Full Stack Developer",
    salary: "₹8-15 LPA",
    summary: "Build end-to-end web applications",
    skillGap: 35,
  },
  {
    id: "role2",
    title: "Data Analyst",
    salary: "₹6-12 LPA",
    summary: "Analyze data and create insights",
    skillGap: 25,
  },
  {
    id: "role3",
    title: "Frontend Developer",
    salary: "₹6-12 LPA",
    summary: "Create beautiful user interfaces",
    skillGap: 20,
  },
];

// ============================================================================
// COMPONENTS
// ============================================================================

// Typing indicator - Pure Reanimated (no setInterval, 60fps)
const TypingIndicator = memo(() => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Staggered infinite bounce animation - pure Reanimated, no JS intervals
    dot1.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 300 }),
        withTiming(0, { duration: 300 })
      ),
      -1, // infinite
      false
    );

    dot2.value = withDelay(
      150,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      )
    );

    dot3.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      )
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, dot1Style]} />
      <Animated.View style={[styles.typingDot, dot2Style]} />
      <Animated.View style={[styles.typingDot, dot3Style]} />
    </View>
  );
});

// Chat bubble
const ChatBubble = ({
  message,
  isOld,
}: {
  message: Message;
  isOld: boolean;
}) => {
  const isSystem = message.type === "system";

  return (
    <Animated.View
      entering={isSystem ? FadeInLeft.duration(500) : FadeInRight.duration(500)}
      style={[
        styles.bubbleContainer,
        isSystem ? styles.systemBubbleContainer : styles.userBubbleContainer,
        isOld && styles.oldMessage,
      ]}
    >
      {message.isTyping ? (
        <TypingIndicator />
      ) : (
        <Text
          style={[
            styles.bubbleText,
            isSystem ? styles.systemBubbleText : styles.userBubbleText,
          ]}
        >
          {message.content}
        </Text>
      )}
    </Animated.View>
  );
};

// Chip button (single/multi select)
const ChipButton = ({
  option,
  isSelected,
  onSelect,
  index,
}: {
  option: string;
  isSelected: boolean;
  onSelect: (option: string) => void;
  index: number;
}) => {
  return (
    <Animated.View entering={FadeIn.delay(index * 80).duration(400)}>
      <Pressable
        style={[styles.chipButton, isSelected && styles.chipButtonSelected]}
        onPress={() => onSelect(option)}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {option}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

// Role card
const RoleCard = ({
  role,
  onSelect,
  index,
}: {
  role: any;
  onSelect: (role: any) => void;
  index: number;
}) => {
  return (
    <Animated.View entering={FadeIn.delay(index * 100).duration(500)}>
      <Pressable style={styles.roleCard} onPress={() => onSelect(role)}>
        <View style={styles.roleCardHeader}>
          <Text style={styles.roleCardTitle}>{role.title}</Text>
          <Text style={styles.roleCardSalary}>{role.salary}</Text>
        </View>
        <Text style={styles.roleCardSummary}>{role.summary}</Text>

        {/* Skill Gap Visualization */}
        <View style={styles.skillGapContainer}>
          <View style={styles.skillGapRow}>
            <Text style={styles.skillGapLabel}>Your Level</Text>
            <View style={styles.skillBar}>
              <View
                style={[
                  styles.skillBarFill,
                  { width: "60%", backgroundColor: "#0066FF" },
                ]}
              />
            </View>
          </View>
          <View style={styles.skillGapRow}>
            <Text style={styles.skillGapLabel}>Industry Expectation</Text>
            <View style={styles.skillBar}>
              <View
                style={[
                  styles.skillBarFill,
                  { width: "95%", backgroundColor: "#10b981" },
                ]}
              />
            </View>
          </View>
          <Text style={styles.skillGapText}>
            Gap: {role.skillGap}% to bridge
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Consent card component
const ConsentCard = ({ onAccept }: { onAccept: () => void }) => {
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const canProceed = termsChecked && privacyChecked;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.consentCard}>
      <Text style={styles.consentTitle}>Data & Privacy</Text>

      <Pressable
        style={styles.checkboxRow}
        onPress={() => setTermsChecked(!termsChecked)}
      >
        <View style={[styles.checkbox, termsChecked && styles.checkboxChecked]}>
          {termsChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          I agree to the Terms of Service
        </Text>
      </Pressable>

      <Pressable
        style={styles.checkboxRow}
        onPress={() => setPrivacyChecked(!privacyChecked)}
      >
        <View
          style={[styles.checkbox, privacyChecked && styles.checkboxChecked]}
        >
          {privacyChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>I agree to the Privacy Policy</Text>
      </Pressable>

      <Pressable
        style={[
          styles.consentButton,
          !canProceed && styles.consentButtonDisabled,
        ]}
        onPress={canProceed ? onAccept : undefined}
        disabled={!canProceed}
      >
        <Text style={styles.consentButtonText}>I Agree</Text>
      </Pressable>
    </Animated.View>
  );
};

// Progress bar
const ProgressBar = ({ progress }: { progress: number }) => {
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withSpring(progress, { damping: 20, stiffness: 90 });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>
      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("intro");
  const [inputValue, setInputValue] = useState("");
  const [numericValue, setNumericValue] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<any>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const {
    setProgress: storeSetProgress,
    addAnswer,
    completeOnboarding,
    setCareerAnalysis,
  } = useOnboardingStore();
  const { name, setName: storeSetName } = useUserStore();

  // PHASE 3: Fetch roles from backend instead of hardcoded
  const [roleCards, setRoleCards] = useState(FALLBACK_ROLE_CARDS);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Fetch roles from backend on mount
  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const response = await api.get<{ data: any[] }>("/roles");
        if (
          response.success &&
          response.data?.data &&
          response.data.data.length > 0
        ) {
          // Transform backend roles to display format
          const transformedRoles = response.data.data
            .slice(0, 6)
            .map((role: any) => ({
              id: role.id,
              title: role.title,
              salary:
                role.salaryMin && role.salaryMax
                  ? `₹${Math.round(role.salaryMin / 100000)}-${Math.round(
                      role.salaryMax / 100000
                    )} LPA`
                  : "Market Rate",
              summary:
                role.description || `${role.category || "Professional"} role`,
              skillGap: 30, // Will be calculated per user later
            }));
          setRoleCards(transformedRoles);
          console.log(
            `✅ Loaded ${transformedRoles.length} roles from backend`
          );
        }
      } catch (error) {
        console.warn(
          "Failed to fetch roles from backend, using fallback:",
          error
        );
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const [userData, setUserData] = useState<UserData>({
    name: name || "",
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

  // Add system messages with PREMIUM typing animation (800-1200ms)
  const addSystemMessages = useCallback(
    async (texts: string[]) => {
      for (let i = 0; i < texts.length; i++) {
        // Show typing indicator
        const typingId = `typing-${Date.now()}-${i}`;
        setMessages((prev) => [
          ...prev,
          {
            id: typingId,
            type: "system",
            content: "",
            timestamp: Date.now(),
            isTyping: true,
          },
        ]);

        // PREMIUM typing delay: 800-1200ms for luxurious feel
        await new Promise((resolve) =>
          setTimeout(resolve, 800 + Math.random() * 400)
        );

        // Replace typing with actual message
        let content = texts[i];
        if (content.includes("{name}")) {
          content = content.replace("{name}", userData.name || "there");
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === typingId ? { ...msg, content, isTyping: false } : msg
          )
        );

        // Elegant pause between messages
        if (i < texts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
      }
    },
    [userData.name]
  );

  // Calculate total questions in user's flow
  const getTotalQuestionsForFlow = useCallback((status: string | null) => {
    // Common questions: 4 (status, gender, age, location)
    let total = 4;

    if (status === "Student") {
      // Student: college, course, semester, subjects, cgpa, aspiration, role = 7
      total += 7;
    } else if (status === "Graduate") {
      // Graduate: college, course, passout, subjects, cgpa, resume, aspiration, role = 8
      total += 8;
    } else if (status === "Working") {
      // Working: resume, office_id (optional), upgrade_goal, role = 4
      total += 4;
    }

    // Analysis + complete = 2
    total += 2;

    return total;
  }, []);

  // Track answered questions count
  const [answeredCount, setAnsweredCount] = useState(0);

  // Process conversation step
  const processStep = useCallback(
    async (stepId: string) => {
      const step = CONVERSATION_FLOW[stepId];
      if (!step || stepId === "done") {
        // Onboarding complete - call backend for REAL analysis
        completeOnboarding();

        try {
          // Call backend API for real career analysis
          const response = await api.post<{ analysis: any }>(
            "/onboarding/analyze",
            {
              userData: {
                name: userData.name,
                status: userData.status,
                gender: userData.gender,
                age: userData.age,
                state: userData.state,
                city: userData.city,
                college: userData.college,
                course: userData.course,
                stream: userData.stream,
                semester: userData.semester,
                passoutYear: userData.passoutYear,
                subjects: userData.subjects,
                cgpa: userData.cgpa,
                careerAspiration: userData.careerAspiration,
                selectedRoleName: userData.selectedRole?.title,
              },
              answers: [], // Not needed for current analysis
            }
          );

          if (response.success && response.data?.analysis) {
            // Store REAL analysis data from backend
            setCareerAnalysis(response.data.analysis);
          } else {
            // Fallback only if backend fails
            console.warn("Backend analysis failed, using fallback");
            setCareerAnalysis({
              skills: [
                {
                  name: "Technical Skills",
                  userLevel: 0.65,
                  industryAvg: 0.75,
                },
                { name: "Communication", userLevel: 0.78, industryAvg: 0.7 },
                { name: "Problem Solving", userLevel: 0.72, industryAvg: 0.68 },
                {
                  name: "Domain Knowledge",
                  userLevel: 0.58,
                  industryAvg: 0.72,
                },
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
            });
          }
        } catch (error) {
          console.error("Failed to get career analysis:", error);
          // Fallback on network error
          setCareerAnalysis({
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
          });
        }

        setTimeout(() => {
          router.push("/(onboarding)/evaluation-progress" as any);
        }, 1500);
        return;
      }

      setCurrentStep(stepId);

      // Add system messages
      if (step.messages.length > 0) {
        await addSystemMessages(step.messages);
      }

      // Show appropriate input
      if (step.inputType === "none") {
        // Auto-advance after delay
        setTimeout(() => {
          const nextStep =
            typeof step.nextStep === "function"
              ? step.nextStep("", userData)
              : step.nextStep;
          processStep(nextStep);
        }, 1000);
      } else {
        setShowInput(true);
        setSelectedChips([]);
        setInputValue("");
        setNumericValue("");
        setLocationState("");
        setLocationCity("");
        setUploadedFile(null);
      }
    },
    [addSystemMessages, userData, completeOnboarding]
  );

  // Handle user response
  const handleUserResponse = useCallback(
    (response: any, displayText?: string) => {
      const step = CONVERSATION_FLOW[currentStep];
      if (!step) return;

      // Validate if needed
      if (step.validator && !step.validator(response)) {
        addSystemMessages(["Please provide a valid answer."]);
        return;
      }

      // Update userData based on question
      let updatedUserData = { ...userData };
      let responseDisplay = displayText || response;

      switch (currentStep) {
        case "ask_name":
          const trimmedName = response.trim();
          updatedUserData.name = trimmedName;
          storeSetName(trimmedName);
          break;
        case "consent":
          responseDisplay = "Accepted terms & privacy";
          break;
        case "ask_status":
          updatedUserData.status = response;
          break;
        case "ask_gender":
          updatedUserData.gender = response;
          break;
        case "ask_age":
          updatedUserData.age = response;
          responseDisplay = `${response} years old`;
          break;
        case "ask_location":
          updatedUserData.state = locationState;
          updatedUserData.city = locationCity;
          responseDisplay = `${locationCity}, ${locationState}`;
          break;
        case "student_college":
        case "graduate_college":
          updatedUserData.college = response;
          break;
        case "student_semester":
          updatedUserData.semester = response;
          responseDisplay = `Semester ${response}`;
          break;
        case "graduate_passout":
          updatedUserData.passoutYear = response;
          responseDisplay = `${response}`;
          break;
        case "student_subjects":
        case "graduate_subjects":
          updatedUserData.subjects = selectedChips;
          responseDisplay = selectedChips.join(", ");
          break;
        case "student_cgpa":
        case "graduate_cgpa":
          updatedUserData.cgpa = parseFloat(response);
          responseDisplay = `CGPA: ${response}`;
          break;
        case "graduate_resume":
        case "working_resume":
          updatedUserData.resume = uploadedFile;
          responseDisplay = uploadedFile?.name || "Resume uploaded";
          break;
        case "working_office_id":
          updatedUserData.officeId = uploadedFile;
          responseDisplay = uploadedFile ? uploadedFile.name : "Skipped";
          break;
        case "student_aspiration":
        case "graduate_aspiration":
          updatedUserData.careerAspiration = response;
          break;
        case "working_upgrade_goal":
          updatedUserData.careerAspiration = response;
          break;
        case "student_role_selection":
        case "graduate_role_selection":
        case "working_role_selection":
          updatedUserData.selectedRole = response;
          responseDisplay = response.title;
          break;
      }

      setUserData(updatedUserData);

      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          type: "user",
          content: responseDisplay,
          timestamp: Date.now(),
        },
      ]);

      // Store answer
      addAnswer({
        questionId: currentStep,
        answer: response,
        timestamp: new Date().toISOString(),
      });

      // Update progress based on validated answer
      const newAnsweredCount = answeredCount + 1;
      setAnsweredCount(newAnsweredCount);
      const totalQuestions = getTotalQuestionsForFlow(updatedUserData.status);
      const newProgress = Math.min(
        100,
        (newAnsweredCount / totalQuestions) * 100
      );
      setProgress(newProgress);
      storeSetProgress(newProgress);

      // Hide input
      setShowInput(false);

      // Process next step
      setTimeout(() => {
        const nextStep =
          typeof step.nextStep === "function"
            ? step.nextStep(response, updatedUserData)
            : step.nextStep;
        processStep(nextStep);
      }, 400);
    },
    [
      currentStep,
      addSystemMessages,
      addAnswer,
      processStep,
      userData,
      selectedChips,
      locationState,
      locationCity,
      uploadedFile,
      answeredCount,
      getTotalQuestionsForFlow,
      storeSetProgress,
    ]
  );

  // Handle text input
  const handleSend = () => {
    const step = CONVERSATION_FLOW[currentStep];
    if (!step) return;

    if (step.inputType === "text" && inputValue.trim()) {
      handleUserResponse(inputValue.trim());
      Keyboard.dismiss();
    } else if (step.inputType === "numeric" && numericValue.trim()) {
      const num = parseFloat(numericValue);
      if (!isNaN(num)) {
        handleUserResponse(num);
        Keyboard.dismiss();
      }
    } else if (step.inputType === "location" && locationState && locationCity) {
      handleUserResponse({ state: locationState, city: locationCity });
      Keyboard.dismiss();
    }
  };

  // Handle chip selection
  const handleChipSelect = (option: string) => {
    const step = CONVERSATION_FLOW[currentStep];
    if (step?.multiSelect) {
      // Multi-select
      if (selectedChips.includes(option)) {
        setSelectedChips(selectedChips.filter((c) => c !== option));
      } else {
        setSelectedChips([...selectedChips, option]);
      }
    } else {
      // Single select - immediate response
      handleUserResponse(option);
    }
  };

  // Handle multi-select confirm
  const handleMultiSelectConfirm = () => {
    if (selectedChips.length > 0) {
      handleUserResponse(selectedChips);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (
        result.canceled === false &&
        result.assets &&
        result.assets.length > 0
      ) {
        const file = result.assets[0];
        setUploadedFile(file);
      }
    } catch (error) {
      console.log("Error picking document:", error);
    }
  };

  const handleFileConfirm = () => {
    const step = CONVERSATION_FLOW[currentStep];
    if (uploadedFile || step?.isOptional) {
      handleUserResponse(uploadedFile);
    }
  };

  // Handle role card selection
  const handleRoleSelect = (role: any) => {
    handleUserResponse(role);
  };

  // Handle consent accept
  const handleConsentAccept = () => {
    handleUserResponse("Consent accepted");
  };

  // Start conversation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      processStep("intro");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  const currentStepData = CONVERSATION_FLOW[currentStep];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background - Blue/Pink Gradient */}
      <ImageBackground
        source={require("../../assets/images/chat-bg.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "rgba(147, 197, 253, 0.3)",
            "rgba(236, 72, 153, 0.2)",
            "rgba(147, 197, 253, 0.3)",
          ]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Cosmic Star Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={require("../../assets/images/odyssey-avatar.png")}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Odyssey</Text>
            <Text style={styles.headerSubtitle}>Your career companion</Text>
          </View>
        </View>
        <ProgressBar progress={progress} />
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => (
            <ChatBubble
              key={message.id}
              message={message}
              isOld={index < messages.length - 3}
            />
          ))}

          {/* Chip Options */}
          {showInput &&
            currentStepData?.inputType === "chips" &&
            currentStepData.options && (
              <View style={styles.chipsContainer}>
                {currentStepData.options.map((option, index) => (
                  <ChipButton
                    key={option}
                    option={option}
                    isSelected={selectedChips.includes(option)}
                    onSelect={handleChipSelect}
                    index={index}
                  />
                ))}
              </View>
            )}

          {/* Multi-Select Chips */}
          {showInput &&
            currentStepData?.inputType === "multi-chips" &&
            currentStepData.options && (
              <>
                <View style={styles.chipsWrap}>
                  {currentStepData.options.map((option, index) => (
                    <ChipButton
                      key={option}
                      option={option}
                      isSelected={selectedChips.includes(option)}
                      onSelect={handleChipSelect}
                      index={index}
                    />
                  ))}
                </View>
                {selectedChips.length > 0 && (
                  <Pressable
                    style={styles.confirmButton}
                    onPress={handleMultiSelectConfirm}
                  >
                    <Text style={styles.confirmButtonText}>
                      Continue with {selectedChips.length} selected
                    </Text>
                  </Pressable>
                )}
              </>
            )}

          {/* Role Cards - PHASE 3: Now from backend */}
          {showInput && currentStepData?.inputType === "role-cards" && (
            <View style={styles.roleCardsContainer}>
              {rolesLoading ? (
                <Text
                  style={{ color: "#fff", textAlign: "center", padding: 20 }}
                >
                  Loading roles...
                </Text>
              ) : (
                roleCards.map((role, index) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    onSelect={handleRoleSelect}
                    index={index}
                  />
                ))
              )}
            </View>
          )}

          {/* Consent Card */}
          {showInput && currentStepData?.inputType === "consent" && (
            <ConsentCard onAccept={handleConsentAccept} />
          )}

          {/* File Upload */}
          {showInput && currentStepData?.inputType === "file" && (
            <View style={styles.fileUploadContainer}>
              <Pressable style={styles.uploadButton} onPress={handleFileUpload}>
                <Text style={styles.uploadButtonText}>
                  {uploadedFile ? "✓ File Selected" : "📎 Choose File"}
                </Text>
              </Pressable>
              {uploadedFile && (
                <Text style={styles.fileName}>{uploadedFile.name}</Text>
              )}
              <Pressable
                style={[
                  styles.confirmButton,
                  !uploadedFile &&
                    !currentStepData.isOptional &&
                    styles.confirmButtonDisabled,
                ]}
                onPress={handleFileConfirm}
                disabled={!uploadedFile && !currentStepData.isOptional}
              >
                <Text style={styles.confirmButtonText}>
                  {currentStepData.isOptional && !uploadedFile
                    ? "Skip"
                    : "Continue"}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Text Input */}
        {showInput &&
          (currentStepData?.inputType === "text" ||
            currentStepData?.inputType === "numeric") && (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.inputContainer}
            >
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={
                    currentStepData.inputType === "numeric"
                      ? numericValue
                      : inputValue
                  }
                  onChangeText={
                    currentStepData.inputType === "numeric"
                      ? setNumericValue
                      : setInputValue
                  }
                  placeholder={
                    currentStepData.inputType === "numeric"
                      ? "Enter number..."
                      : "Type your answer..."
                  }
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  autoFocus
                  keyboardType={
                    currentStepData.inputType === "numeric"
                      ? "numeric"
                      : "default"
                  }
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                />
                <Pressable
                  style={[
                    styles.sendButton,
                    !inputValue.trim() &&
                      !numericValue.trim() &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!inputValue.trim() && !numericValue.trim()}
                >
                  <Text style={styles.sendIcon}>→</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

        {/* Location Input */}
        {showInput && currentStepData?.inputType === "location" && (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.inputContainer}
          >
            <View style={styles.locationInputs}>
              <TextInput
                style={styles.locationInput}
                value={locationState}
                onChangeText={setLocationState}
                placeholder="State"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <TextInput
                style={styles.locationInput}
                value={locationCity}
                onChangeText={setLocationCity}
                placeholder="City"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>
            <Pressable
              style={[
                styles.confirmButton,
                (!locationState || !locationCity) &&
                  styles.confirmButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!locationState || !locationCity}
            >
              <Text style={styles.confirmButtonText}>Continue</Text>
            </Pressable>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e293b",
  },
  background: {
    position: "absolute",
    width: width,
    height: height,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  } as any,
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "white",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0066FF",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
    width: 40,
    textAlign: "right",
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 120,
  },
  bubbleContainer: {
    maxWidth: "80%",
    marginBottom: 14,
    padding: 16,
    borderRadius: 22,
  },
  systemBubbleContainer: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderBottomLeftRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  userBubbleContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#0066FF",
    borderBottomRightRadius: 6,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  systemBubbleText: {
    color: "#1f2937",
  },
  userBubbleText: {
    color: "white",
  },
  oldMessage: {
    opacity: 0.65,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
  },
  typingDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#9ca3af",
  },
  chipsContainer: {
    marginTop: 20,
    gap: 12,
  },
  chipsWrap: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chipButton: {
    backgroundColor: "rgba(30, 58, 138, 0.7)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  chipButtonSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.8)",
    borderColor: "rgba(16, 185, 129, 1)",
  },
  chipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  chipTextSelected: {
    color: "white",
  },
  roleCardsContainer: {
    marginTop: 20,
    gap: 16,
  },
  roleCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  roleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roleCardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  roleCardSalary: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10b981",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  roleCardSummary: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 16,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  skillGapContainer: {
    marginTop: 8,
  },
  skillGapRow: {
    marginBottom: 10,
  },
  skillGapLabel: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 6,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  skillBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  skillBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  skillGapText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f59e0b",
    marginTop: 6,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  fileUploadContainer: {
    marginTop: 20,
    gap: 12,
  },
  uploadButton: {
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  fileName: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  confirmButton: {
    backgroundColor: "#0066FF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: "rgba(107, 114, 128, 0.5)",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  consentCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  consentTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#0066FF",
    borderColor: "#0066FF",
  },
  checkmark: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    color: "#4b5563",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  consentButton: {
    backgroundColor: "#0066FF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  consentButtonDisabled: {
    backgroundColor: "rgba(107, 114, 128, 0.5)",
  },
  consentButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 25,
    paddingLeft: 20,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "white",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  sendButton: {
    backgroundColor: "#0066FF",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(107, 114, 128, 0.4)",
  },
  sendIcon: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },
  locationInputs: {
    gap: 12,
    marginBottom: 12,
  },
  locationInput: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
});
