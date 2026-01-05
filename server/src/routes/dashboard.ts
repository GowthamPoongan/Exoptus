/**
 * Dashboard Routes
 *
 * Returns dashboard data: JR Score, profile steps, roadmap, tasks, notifications.
 * Backend is source of truth - no mock data in frontend stores.
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /dashboard
 * Returns all dashboard data for authenticated user
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Get user's career analysis for JR Score
    const analysis = await prisma.careerAnalysis.findUnique({
      where: { userId },
    });

    // Get user's onboarding profile to determine profile completion
    const profile = await prisma.onboardingProfile.findUnique({
      where: { userId },
    });

    // Build profile steps based on what's completed
    const profileSteps = [
      {
        id: "basic_info",
        label: "Basic Info",
        completed: !!profile?.name,
      },
      {
        id: "education",
        label: "Education",
        completed: !!profile?.college || !!profile?.course,
      },
      {
        id: "skills",
        label: "Skills",
        completed: !!profile?.subjects,
      },
      {
        id: "career_goals",
        label: "Career Goals",
        completed: !!profile?.careerAspiration || !!profile?.selectedRoleName,
      },
      {
        id: "preferences",
        label: "Preferences",
        completed: false, // Will be set when preferences are added
      },
    ];

    const completedSteps = profileSteps.filter((s) => s.completed).length;
    const currentStep = Math.min(completedSteps, profileSteps.length - 1);

    // Build roadmap levels based on JR Score
    const jrScore = analysis?.jrScore || 0;
    const roadmapLevels = [
      {
        id: "foundation",
        title: "Foundation",
        description: "Build your core skills and understanding",
        status: jrScore >= 0 ? "in_progress" : "locked",
        order: 1,
        items: [
          {
            id: "f1",
            title: "Complete profile assessment",
            description: "Help us understand your current skills and goals",
            effort: "low",
            skillImpact: 3,
            completed: !!profile,
          },
          {
            id: "f2",
            title: "Set career goals",
            description: "Define where you want to be in 1-3 years",
            effort: "medium",
            skillImpact: 5,
            completed: !!profile?.careerAspiration,
          },
          {
            id: "f3",
            title: "Identify skill gaps",
            description: "Understand what you need to learn",
            effort: "low",
            skillImpact: 4,
            completed: !!analysis,
          },
        ],
      },
      {
        id: "intermediate",
        title: "Intermediate",
        description: "Develop practical experience and portfolio",
        status: jrScore >= 40 ? "in_progress" : "locked",
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
        status: jrScore >= 65 ? "in_progress" : "locked",
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
        status: jrScore >= 85 ? "in_progress" : "locked",
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

    // Build notifications
    const notifications = [
      {
        id: "1",
        title: "Welcome to EXOPTUS!",
        message:
          "Your career journey begins here. Complete your profile to get personalized recommendations.",
        read: false,
        createdAt: new Date().toISOString(),
        type: "info",
      },
    ];

    if (analysis && analysis.jrScore && analysis.jrScore < 50) {
      notifications.push({
        id: "2",
        title: "Improve your JR Score",
        message: `Your current score is ${analysis.jrScore}. Complete skill assessments to improve.`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "action",
      });
    }

    // Build JR Score history (would come from DB in production)
    const today = new Date();
    const jrScoreHistory = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (5 - i));
      const baseScore = jrScore || 50;
      const variance = Math.floor(Math.random() * 10) - 5;
      return {
        date: date.toISOString().split("T")[0],
        score: Math.max(0, Math.min(100, baseScore - (5 - i) * 2 + variance)),
      };
    });

    // Make sure the latest score matches the actual JR score
    if (jrScoreHistory.length > 0) {
      jrScoreHistory[jrScoreHistory.length - 1].score = jrScore || 50;
    }

    // Build JR Score breakdown from Gemini analysis
    const jrScoreBreakdown = analysis
      ? {
          confidence: analysis.jrConfidence || 0,
          clarity: analysis.jrClarity || 0,
          consistency: analysis.jrConsistency || 0,
          executionReadiness: analysis.jrExecutionReadiness || 0,
          riskFlags: analysis.jrRiskFlags
            ? JSON.parse(analysis.jrRiskFlags)
            : [],
          reasoning: analysis.jrReasoning || null,
          source: analysis.jrSource || "unknown",
        }
      : null;

    res.json({
      success: true,
      data: {
        jrScore: jrScore || 0,
        jrScoreBreakdown,
        jrScoreHistory,
        profileSteps,
        currentProfileStep: currentStep,
        roadmapLevels,
        notifications,
        tasks: [], // Tasks will be user-created
        insights: {
          daysActive: 1,
          tasksDone: 0,
          jrGrowth: 0,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching dashboard:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch dashboard data",
    });
  }
});

/**
 * GET /dashboard/notifications
 * Returns user notifications
 */
router.get(
  "/notifications",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      // In production, fetch from notifications table
      const notifications = [
        {
          id: "1",
          title: "Welcome to EXOPTUS!",
          message:
            "Your career journey begins here. Complete your profile to get personalized recommendations.",
          read: false,
          createdAt: new Date().toISOString(),
          type: "info",
        },
        {
          id: "2",
          title: "New skill assessment available",
          message: "Take the quick assessment to update your JR Score.",
          read: false,
          createdAt: new Date().toISOString(),
          type: "action",
        },
      ];

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch notifications",
      });
    }
  }
);

/**
 * PATCH /dashboard/notifications/:id/read
 * Mark notification as read
 */
router.patch(
  "/notifications/:id/read",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // In production, update notification in DB

      res.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to mark notification as read",
      });
    }
  }
);

export default router;
