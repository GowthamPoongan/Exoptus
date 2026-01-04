import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { calculateJRScore, isGeminiConfigured } from "../lib/gemini";
import { UserScoringContext, JRScoreResult } from "../types/jr-score";

const router = Router();
const prisma = new PrismaClient();

// ============================================================================
// CONVERSATION FLOW DEFINITION (Source of Truth)
// ============================================================================

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
  nextStep: string | null;
  validator?: string;
  isOptional?: boolean;
}

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
    nextStep: "branch_by_status", // Frontend resolves based on status
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
};

/**
 * GET /onboarding/flow
 * Returns the conversation flow definition
 * Frontend fetches this to drive the chat UI
 */
router.get("/flow", async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      flow: {
        steps: CONVERSATION_FLOW,
        totalSteps: 14, // Approximate for progress calculation
        initialStep: "intro",
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching flow:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch onboarding flow",
    });
  }
});

/**
 * POST /onboarding/analyze
 * Trigger career analysis based on collected user data
 * Called when user completes onboarding flow
 */
router.post("/analyze", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { userData, answers } = req.body;

    if (!userData) {
      return res.status(400).json({
        success: false,
        error: "userData is required",
      });
    }

    // PHASE 3: Persist onboarding answers if provided
    // This enables: "User onboarding responses are persisted server-side"
    if (answers && Array.isArray(answers) && answers.length > 0) {
      // Delete old answers for this user (in case of re-onboarding)
      await prisma.onboardingAnswer.deleteMany({
        where: { userId },
      });

      // Insert new answers
      const answerRecords = answers.map((answer: any) => ({
        userId,
        questionId: answer.questionId || "unknown",
        answer:
          typeof answer.answer === "string"
            ? answer.answer
            : JSON.stringify(answer.answer),
      }));

      await prisma.onboardingAnswer.createMany({
        data: answerRecords,
      });

      console.log(
        `✅ Persisted ${answerRecords.length} onboarding answers for user ${userId}`
      );
    }

    // Also persist answers from userData fields as individual records
    const userDataAnswers = [
      { questionId: "name", answer: userData.name },
      { questionId: "status", answer: userData.status },
      { questionId: "gender", answer: userData.gender },
      { questionId: "age", answer: userData.age?.toString() },
      { questionId: "state", answer: userData.state },
      { questionId: "city", answer: userData.city },
      { questionId: "college", answer: userData.college },
      { questionId: "course", answer: userData.course },
      { questionId: "semester", answer: userData.semester?.toString() },
      { questionId: "passoutYear", answer: userData.passoutYear?.toString() },
      {
        questionId: "subjects",
        answer: JSON.stringify(userData.subjects || []),
      },
      { questionId: "cgpa", answer: userData.cgpa?.toString() },
      { questionId: "careerAspiration", answer: userData.careerAspiration },
      { questionId: "selectedRole", answer: userData.selectedRoleName },
    ].filter((a) => a.answer); // Only persist non-empty answers

    if (userDataAnswers.length > 0) {
      await prisma.onboardingAnswer.createMany({
        data: userDataAnswers.map((a) => ({
          userId,
          questionId: `userData_${a.questionId}`,
          answer: a.answer!,
        })),
      });
    }

    // ============================================
    // UPDATE USER IDENTITY DATA
    // ============================================
    // Auth ≠ Profile: Auth proves WHO, Profile stores WHO THEY SAY THEY ARE
    // Update User.name and mark onboarding complete
    if (userData.name) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: userData.name,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          onboardingStatus: "completed",
        },
      });
      console.log(
        `✅ Updated User.name to "${userData.name}" for user ${userId}`
      );
    }

    // Also create/update Profile table for quick access
    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        name: userData.name,
        college: userData.college,
        course: userData.course,
        year: userData.semester || userData.passoutYear,
        // goals: userData.careerAspiration
        //   ? JSON.stringify([userData.careerAspiration])
        //   : null,
      },
      update: {
        name: userData.name,
        college: userData.college,
        course: userData.course,
        year: userData.semester || userData.passoutYear,
        // goals: userData.careerAspiration
        //   ? JSON.stringify([userData.careerAspiration])
        //   : null,
      },
    });

    // Get user's onboarding profile or create from userData
    let profile = await prisma.onboardingProfile.findUnique({
      where: { userId },
    });

    if (!profile && userData) {
      // Create profile from userData
      profile = await prisma.onboardingProfile.create({
        data: {
          userId,
          name: userData.name,
          gender: userData.gender,
          age: userData.age,
          state: userData.state,
          city: userData.city,
          status: userData.status || "Student",
          college: userData.college,
          course: userData.course,
          stream: userData.stream,
          semester: userData.semester,
          passoutYear: userData.passoutYear,
          cgpa: userData.cgpa,
          subjects: userData.subjects
            ? JSON.stringify(userData.subjects)
            : null,
          careerAspiration: userData.careerAspiration,
          selectedRoleName: userData.selectedRole?.title,
          completedAt: new Date(),
        },
      });
    }

    // Generate analysis
    const submissionData = {
      name: userData.name || profile?.name || "",
      status: userData.status || profile?.status || "Student",
      subjects:
        userData.subjects ||
        (profile?.subjects ? JSON.parse(profile.subjects) : []),
      passoutYear: userData.passoutYear || profile?.passoutYear,
    };

    const analysis = await generateCareerAnalysis(
      userId,
      submissionData as any
    );

    // Build frontend-friendly response
    const analysisResponse = {
      skills: [
        {
          name: "Technical Skills",
          userLevel: Math.min(1, (analysis.jrScore || 50) / 100 + 0.15),
          industryAvg: 0.75,
        },
        { name: "Communication", userLevel: 0.78, industryAvg: 0.7 },
        { name: "Problem Solving", userLevel: 0.72, industryAvg: 0.68 },
        {
          name: "Domain Knowledge",
          userLevel: Math.min(1, (analysis.jrScore || 50) / 100 - 0.07),
          industryAvg: 0.72,
        },
      ],
      growthProjection: [
        { month: 0, readiness: (analysis.jrScore || 50) / 100 - 0.05 },
        {
          month: 3,
          readiness: Math.min(1, (analysis.jrScore || 50) / 100 + 0.17),
        },
        {
          month: 6,
          readiness: Math.min(1, (analysis.jrScore || 50) / 100 + 0.33),
        },
        {
          month: 9,
          readiness: Math.min(1, (analysis.jrScore || 50) / 100 + 0.43),
        },
        { month: 12, readiness: 0.95 },
      ],
      strengths: [
        "Strong academic foundation",
        "Natural communication ability",
      ],
      focusAreas: analysis.missingSkills
        ? JSON.parse(analysis.missingSkills).slice(0, 2)
        : ["Industry-specific tools", "Real-world project experience"],
      readinessTimeline: `${analysis.estimatedMonths || 9}-${
        (analysis.estimatedMonths || 9) + 3
      } months`,
      jrScore: analysis.jrScore,
      topRole: analysis.topRole,
      topRoleMatch: analysis.topRoleMatch,
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      analysis: analysisResponse,
    });
  } catch (error: any) {
    console.error("❌ Error analyzing career data:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze career data",
    });
  }
});

/**
 * Onboarding submission schema - matches chat screen data
 * Validates all 20 fields collected during chat
 */
const OnboardingSubmissionSchema = z.object({
  // Personal Information
  name: z.string().min(1),
  gender: z.string().optional(),
  age: z.number().int().positive().optional(),
  state: z.string().optional(),
  city: z.string().optional(),

  // Status (Student, Graduate, or Working)
  status: z.enum(["Student", "Graduate", "Working"]),

  // Academic Details
  college: z.string().optional(),
  course: z.string().optional(),
  stream: z.string().optional(),
  semester: z.number().int().positive().optional(),
  passoutYear: z.number().int().optional(),
  cgpa: z.number().optional(),

  // Skills (array of selected skills)
  subjects: z.array(z.string()).optional(),

  // Career Aspiration & Role Selection
  careerAspiration: z.string().optional(),
  selectedRoleName: z.string().optional(),
  selectedRoleId: z.string().optional(),
  expectedSalary: z.string().optional(),

  // File URLs
  resumeUrl: z.string().url().optional(),
  officeIdUrl: z.string().url().optional(),

  // Flow path for tracking
  flowPath: z.enum(["student", "graduate", "working"]).optional(),
});

type OnboardingSubmission = z.infer<typeof OnboardingSubmissionSchema>;

/**
 * POST /onboarding/submit
 * Accept all onboarding data from chat screen
 * Validate, store, and trigger career analysis
 */
router.post("/submit", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Validate request body
    const validatedData = OnboardingSubmissionSchema.parse(req.body);

    // Update User model with basic info
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: validatedData.name,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        onboardingStatus: "completed",
      },
    });

    // Create or update OnboardingProfile with all chat data
    const onboardingProfile = await prisma.onboardingProfile.upsert({
      where: { userId },
      create: {
        userId,
        name: validatedData.name,
        gender: validatedData.gender,
        age: validatedData.age,
        state: validatedData.state,
        city: validatedData.city,
        status: validatedData.status,
        college: validatedData.college,
        course: validatedData.course,
        stream: validatedData.stream,
        semester: validatedData.semester,
        passoutYear: validatedData.passoutYear,
        cgpa: validatedData.cgpa,
        subjects: validatedData.subjects
          ? JSON.stringify(validatedData.subjects)
          : null,
        careerAspiration: validatedData.careerAspiration,
        selectedRoleId: validatedData.selectedRoleId,
        selectedRoleName: validatedData.selectedRoleName,
        expectedSalary: validatedData.expectedSalary,
        resumeUrl: validatedData.resumeUrl,
        officeIdUrl: validatedData.officeIdUrl,
        flowPath: validatedData.flowPath,
        completedAt: new Date(),
      },
      update: {
        name: validatedData.name,
        gender: validatedData.gender,
        age: validatedData.age,
        state: validatedData.state,
        city: validatedData.city,
        status: validatedData.status,
        college: validatedData.college,
        course: validatedData.course,
        stream: validatedData.stream,
        semester: validatedData.semester,
        passoutYear: validatedData.passoutYear,
        cgpa: validatedData.cgpa,
        subjects: validatedData.subjects
          ? JSON.stringify(validatedData.subjects)
          : null,
        careerAspiration: validatedData.careerAspiration,
        selectedRoleId: validatedData.selectedRoleId,
        selectedRoleName: validatedData.selectedRoleName,
        expectedSalary: validatedData.expectedSalary,
        resumeUrl: validatedData.resumeUrl,
        officeIdUrl: validatedData.officeIdUrl,
        flowPath: validatedData.flowPath,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Generate career analysis
    const analysis = await generateCareerAnalysis(userId, validatedData);

    res.json({
      success: true,
      message: "Onboarding data saved successfully",
      data: {
        onboarding: onboardingProfile,
        analysis: {
          jrScore: analysis.jrScore,
          skillGap: analysis.skillGap,
          topRole: analysis.topRole,
          topRoleMatch: analysis.topRoleMatch,
          missingSkills: analysis.missingSkills,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Onboarding submission error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to process onboarding",
    });
  }
});

/**
 * GET /onboarding/profile
 * Retrieve user's onboarding profile and analysis
 */
router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const profile = await prisma.onboardingProfile.findUnique({
      where: { userId },
    });

    const analysis = await prisma.careerAnalysis.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Onboarding profile not found",
      });
    }

    res.json({
      success: true,
      data: {
        profile,
        analysis,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch profile",
    });
  }
});

/**
 * Career Analysis Engine
 * Calculates JR Score using Gemini AI with fallback safety
 * Stores skill gaps, and role recommendations
 */
async function generateCareerAnalysis(
  userId: string,
  userData: OnboardingSubmission
) {
  // Get all available roles for matching
  const allRoles = await prisma.role.findMany();

  // Parse user skills
  const userSkills = userData.subjects || [];
  const userSkillsLower = userSkills.map((s) => s.toLowerCase());

  // Calculate metrics for each role
  const roleMatches = allRoles.map((role) => {
    const requiredSkills = JSON.parse(role.skillsRequired);
    const matchedSkills = requiredSkills.filter((skill: string) =>
      userSkillsLower.includes(skill.toLowerCase())
    );
    const matchPercentage = Math.round(
      (matchedSkills.length / requiredSkills.length) * 100
    );

    return {
      role,
      matchPercentage,
      matchedSkills,
      missingSkills: requiredSkills.filter(
        (skill: string) => !userSkillsLower.includes(skill.toLowerCase())
      ),
    };
  });

  // Sort by match percentage and get top role
  const sortedMatches = roleMatches.sort(
    (a, b) => b.matchPercentage - a.matchPercentage
  );
  const topMatch = sortedMatches[0];

  // ============================================
  // GEMINI AI JR SCORE CALCULATION
  // ============================================
  // Build user context for Gemini
  const scoringContext: UserScoringContext = {
    name: userData.name,
    status: userData.status as "Student" | "Graduate" | "Working",
    age: userData.age,
    gender: userData.gender,
    state: userData.state,
    city: userData.city,
    college: userData.college,
    course: userData.course,
    stream: userData.stream,
    semester: userData.semester,
    passoutYear: userData.passoutYear,
    cgpa: userData.cgpa,
    subjects: userData.subjects,
    careerAspiration: userData.careerAspiration,
    selectedRoleName: userData.selectedRoleName,
    resumeUrl: userData.resumeUrl,
  };

  // Call Gemini (with full safety guarantees - never throws)
  console.log(`🤖 Calculating JR Score for user ${userId}...`);
  const jrScoreResult: JRScoreResult = await calculateJRScore(scoringContext);
  console.log(
    `✅ JR Score calculated: ${jrScoreResult.jr_score} (source: ${jrScoreResult.source})`
  );

  // Build missing skills list from role matching
  const allMissingSkills = new Set<string>();
  sortedMatches.slice(0, 3).forEach((match) => {
    match.missingSkills.forEach((skill: string) => {
      allMissingSkills.add(skill);
    });
  });

  // Create or update CareerAnalysis with Gemini score breakdown
  const analysis = await prisma.careerAnalysis.upsert({
    where: { userId },
    create: {
      userId,
      // JR Score from Gemini (or fallback)
      jrScore: jrScoreResult.jr_score,
      // JR Score breakdown - temporarily disabled
      // jrConfidence: jrScoreResult.confidence,
      // jrClarity: jrScoreResult.clarity,
      // jrConsistency: jrScoreResult.consistency,
      // jrExecutionReadiness: jrScoreResult.execution_readiness,
      // jrRiskFlags: JSON.stringify(jrScoreResult.risk_flags),
      // jrReasoning: jrScoreResult.reasoning,
      // jrSource: jrScoreResult.source,
      // Role matching data
      skillGap: topMatch ? 100 - topMatch.matchPercentage : 80,
      topRole: topMatch?.role.title,
      topRoleMatch: topMatch?.matchPercentage,
      matchedRoleIds: sortedMatches.map((m) => m.role.id).join(","),
      missingSkills: JSON.stringify(Array.from(allMissingSkills)),
      growthMatrix: buildGrowthMatrix(
        userSkills,
        topMatch?.missingSkills || []
      ),
      estimatedMonths: calculateMonthsToTarget(jrScoreResult.jr_score),
    },
    update: {
      // JR Score from Gemini (or fallback)
      jrScore: jrScoreResult.jr_score,
      // JR Score breakdown - temporarily disabled
      // jrConfidence: jrScoreResult.confidence,
      // jrClarity: jrScoreResult.clarity,
      // jrConsistency: jrScoreResult.consistency,
      // jrExecutionReadiness: jrScoreResult.execution_readiness,
      // jrRiskFlags: JSON.stringify(jrScoreResult.risk_flags),
      // jrReasoning: jrScoreResult.reasoning,
      // jrSource: jrScoreResult.source,
      // Role matching data
      skillGap: topMatch ? 100 - topMatch.matchPercentage : 80,
      topRole: topMatch?.role.title,
      topRoleMatch: topMatch?.matchPercentage,
      matchedRoleIds: sortedMatches.map((m) => m.role.id).join(","),
      missingSkills: JSON.stringify(Array.from(allMissingSkills)),
      growthMatrix: buildGrowthMatrix(
        userSkills,
        topMatch?.missingSkills || []
      ),
      estimatedMonths: calculateMonthsToTarget(jrScoreResult.jr_score),
      updatedAt: new Date(),
    },
  });

  // Also update User.jrScore for quick access
  await prisma.user.update({
    where: { id: userId },
    data: {
      jrScore: jrScoreResult.jr_score,
      jrScoreUpdatedAt: new Date(),
    },
  });

  return analysis;
}

/**
 * Helper: Build growth matrix showing skill progression
 */
function buildGrowthMatrix(userSkills: string[], targetSkills: string[]) {
  const matrix = {};

  // Current skills at level 8/10
  userSkills.forEach((skill) => {
    (matrix as any)[skill] = { current: 8, target: 10, months: 2 };
  });

  // Missing skills need to be learned
  targetSkills.forEach((skill) => {
    if (!(matrix as any)[skill]) {
      (matrix as any)[skill] = { current: 0, target: 7, months: 6 };
    }
  });

  return JSON.stringify(matrix);
}

/**
 * Helper: Estimate months to reach ideal JR score (90+)
 */
function calculateMonthsToTarget(currentScore: number): number {
  if (currentScore >= 90) return 0;
  if (currentScore >= 75) return 3;
  if (currentScore >= 50) return 6;
  return 12;
}

export default router;
