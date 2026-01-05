/**
 * Onboarding Chat Flow Configuration
 *
 * NOTE: This file contains extracted chat flow definitions from chat.tsx.
 * For Phase 1 stability, the chat.tsx file retains its own copy.
 *
 * TODO (Phase 2): Migrate chat.tsx to use these imports.
 *
 * Contains:
 * - CONVERSATION_FLOW: The conversation state machine
 * - ROLE_CARDS: Mock role card data
 * - Types: InputType, ConversationStep, UserData, RoleCard
 */

// ============================================================================
// TYPES
// ============================================================================

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
  nextStep: string | ((answer: any, userData: any) => string);
  validator?: (answer: any) => boolean;
  isOptional?: boolean;
}

export interface UserData {
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

export interface RoleCard {
  id: string;
  title: string;
  salary: string;
  summary: string;
  skillGap: number;
}

// ============================================================================
// CONVERSATION FLOW - COMPREHENSIVE ONBOARDING SYSTEM
// ============================================================================

export const CONVERSATION_FLOW: Record<string, ConversationStep> = {
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

// ============================================================================
// MOCK ROLE DATA
// ============================================================================

export const ROLE_CARDS: RoleCard[] = [
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
