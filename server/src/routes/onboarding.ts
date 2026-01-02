import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";

const router = Router();
const prisma = new PrismaClient();

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
 * Calculates JR Score, skill gaps, and role recommendations
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

  // Calculate JR Score (0-100)
  // Formula: (user_skills / average_role_skills * 50) + (experience_level * 20) + (education_fit * 30)
  const skillScore = topMatch
    ? (topMatch.matchPercentage / 100) * 50
    : Math.min((userSkills.length / 10) * 50, 50);

  const experienceScore = getExperienceScore(userData.status);
  const educationScore = getEducationScore(
    userData.status,
    userData.passoutYear
  );

  const jrScore = Math.min(
    100,
    Math.round(skillScore + experienceScore + educationScore)
  );

  // Build missing skills list
  const allMissingSkills = new Set<string>();
  sortedMatches.slice(0, 3).forEach((match) => {
    match.missingSkills.forEach((skill: string) => {
      allMissingSkills.add(skill);
    });
  });

  // Create or update CareerAnalysis
  const analysis = await prisma.careerAnalysis.upsert({
    where: { userId },
    create: {
      userId,
      jrScore,
      skillGap: topMatch ? 100 - topMatch.matchPercentage : 80,
      topRole: topMatch?.role.title,
      topRoleMatch: topMatch?.matchPercentage,
      matchedRoleIds: sortedMatches.map((m) => m.role.id).join(","),
      missingSkills: JSON.stringify(Array.from(allMissingSkills)),
      growthMatrix: buildGrowthMatrix(
        userSkills,
        topMatch?.missingSkills || []
      ),
      estimatedMonths: calculateMonthsToTarget(jrScore),
    },
    update: {
      jrScore,
      skillGap: topMatch ? 100 - topMatch.matchPercentage : 80,
      topRole: topMatch?.role.title,
      topRoleMatch: topMatch?.matchPercentage,
      matchedRoleIds: sortedMatches.map((m) => m.role.id).join(","),
      missingSkills: JSON.stringify(Array.from(allMissingSkills)),
      growthMatrix: buildGrowthMatrix(
        userSkills,
        topMatch?.missingSkills || []
      ),
      estimatedMonths: calculateMonthsToTarget(jrScore),
      updatedAt: new Date(),
    },
  });

  return analysis;
}

/**
 * Helper: Calculate experience score based on user status
 */
function getExperienceScore(status?: string): number {
  switch (status) {
    case "Student":
      return 5; // Beginner level
    case "Graduate":
      return 15; // Recently graduated
    case "Working":
      return 25; // Already has experience
    default:
      return 0;
  }
}

/**
 * Helper: Calculate education score based on status and graduation year
 */
function getEducationScore(status?: string, passoutYear?: number): number {
  if (status === "Student") {
    return 15; // Currently studying
  }

  if (!passoutYear) return 0;

  const yearsSinceGraduation = new Date().getFullYear() - passoutYear;

  if (yearsSinceGraduation <= 0) {
    return 20; // Recent graduate
  }

  if (yearsSinceGraduation <= 2) {
    return 25; // Recent with experience
  }

  return 30; // Established professional
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
