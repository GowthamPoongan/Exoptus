import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { checkGeminiHealth, isGeminiConfigured } from "../lib/gemini";

const router = Router();
const prisma = new PrismaClient();

/**
 * ADMIN ROUTES
 * All admin endpoints require special authentication
 * In production, add role-based access control
 */

// Simple admin auth middleware (in production, use proper JWT with role)
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const adminKey = req.headers["x-admin-key"];
  const expectedKey =
    process.env.ADMIN_KEY || "admin-secret-key-change-in-prod";

  if (adminKey !== expectedKey) {
    return res.status(403).json({
      success: false,
      error: "Unauthorized - invalid admin key",
    });
  }

  next();
};

/**
 * GET /admin/stats
 * Dashboard statistics overview
 */
router.get("/stats", requireAdmin, async (req: Request, res: Response) => {
  try {
    const [totalUsers, completedOnboarding, avgJRScore, totalJobs, totalRoles] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { onboardingCompleted: true },
        }),
        prisma.careerAnalysis.aggregate({
          _avg: { jrScore: true },
        }),
        prisma.job.count(),
        prisma.role.count(),
      ]);

    const onboardingRate =
      totalUsers > 0 ? Math.round((completedOnboarding / totalUsers) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        completedOnboarding,
        onboardingCompletionRate: `${onboardingRate}%`,
        averageJRScore: avgJRScore._avg.jrScore || 0,
        totalJobs,
        totalRoles,
        stats: {
          users: {
            total: totalUsers,
            completed_onboarding: completedOnboarding,
            pending_onboarding: totalUsers - completedOnboarding,
          },
          jobs: {
            total: totalJobs,
            active: await prisma.job.count({
              where: { expiresAt: { gt: new Date() } },
            }),
          },
          roles: {
            total: totalRoles,
          },
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /admin/users
 * List all users with pagination
 */
router.get("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { limit = "20", offset = "0", search } = req.query;

    let where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: "insensitive" } },
        { name: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        onboardingProfile: {
          select: {
            status: true,
            college: true,
            careerAspiration: true,
            completedAt: true,
          },
        },
        careerAnalysis: {
          select: {
            jrScore: true,
            topRole: true,
            updatedAt: true,
          },
        },
      },
      take: parseInt(String(limit)),
      skip: parseInt(String(offset)),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: users,
      pagination: {
        limit: parseInt(String(limit)),
        offset: parseInt(String(offset)),
        total,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /admin/users/:userId
 * Get detailed user profile
 */
router.get(
  "/users/:userId",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          onboardingProfile: true,
          careerAnalysis: true,
          userFeedback: true,
          sessions: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /admin/analytics/onboarding
 * Onboarding completion analytics
 */
router.get(
  "/analytics/onboarding",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      // Get onboarding by status
      const byStatus = await prisma.onboardingProfile.groupBy({
        by: ["status"],
        _count: true,
      });

      // Get onboarding by flow path
      const byFlowPath = await prisma.onboardingProfile.groupBy({
        by: ["flowPath"],
        _count: true,
      });

      // Get onboarding by career aspiration (top 10)
      const byCareerAspiration = await prisma.onboardingProfile.groupBy({
        by: ["careerAspiration"],
        _count: true,
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      });

      res.json({
        success: true,
        data: {
          byStatus,
          byFlowPath,
          topCareerAspirations: byCareerAspiration,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /admin/analytics/jr-score
 * JR Score distribution analytics
 */
router.get(
  "/analytics/jr-score",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const analyses = await prisma.careerAnalysis.findMany({
        select: { jrScore: true, topRole: true },
      });

      // Calculate distribution buckets
      const distribution = {
        "0-20": analyses.filter((a: any) => a.jrScore < 20).length,
        "20-40": analyses.filter((a: any) => a.jrScore >= 20 && a.jrScore < 40)
          .length,
        "40-60": analyses.filter((a: any) => a.jrScore >= 40 && a.jrScore < 60)
          .length,
        "60-80": analyses.filter((a: any) => a.jrScore >= 60 && a.jrScore < 80)
          .length,
        "80-100": analyses.filter((a: any) => a.jrScore >= 80).length,
      };

      // Top roles
      const topRoles = await prisma.careerAnalysis.groupBy({
        by: ["topRole"],
        _count: true,
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      });

      res.json({
        success: true,
        data: {
          distribution,
          topRoles,
          averageScore:
            analyses.length > 0
              ? (
                  analyses.reduce((sum: number, a: any) => sum + a.jrScore, 0) /
                  analyses.length
                ).toFixed(2)
              : 0,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /admin/jobs
 * List all jobs with filters
 */
router.get("/jobs", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { limit = "20", offset = "0" } = req.query;

    const jobs = await prisma.job.findMany({
      include: {
        role: {
          select: {
            title: true,
            category: true,
          },
        },
      },
      take: parseInt(String(limit)),
      skip: parseInt(String(offset)),
      orderBy: { postedAt: "desc" },
    });

    const total = await prisma.job.count();

    res.json({
      success: true,
      data: jobs,
      pagination: {
        limit: parseInt(String(limit)),
        offset: parseInt(String(offset)),
        total,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /admin/roles
 * List all roles
 */
router.get("/roles", requireAdmin, async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: { demandLevel: "desc" },
    });

    const formattedRoles = roles.map((role: any) => ({
      ...role,
      skillsRequired: JSON.parse(role.skillsRequired),
    }));

    res.json({
      success: true,
      data: formattedRoles,
      count: formattedRoles.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /admin/users/:userId
 * Delete user (GDPR compliance)
 */
router.delete(
  "/users/:userId",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // This will cascade delete all related data due to onDelete: Cascade
      await prisma.user.delete({
        where: { id: userId },
      });

      res.json({
        success: true,
        message: `User ${userId} deleted successfully`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * POST /admin/roles
 * Create new role
 */
router.post("/roles", requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      salaryMin,
      salaryMax,
      skillsRequired,
      experienceYears,
      educationLevel,
      category,
      difficulty,
      demandLevel,
    } = req.body;

    const role = await prisma.role.create({
      data: {
        title,
        description,
        salaryMin,
        salaryMax,
        skillsRequired: JSON.stringify(skillsRequired),
        experienceYears,
        educationLevel,
        category,
        difficulty,
        demandLevel,
      },
    });

    res.json({
      success: true,
      data: {
        ...role,
        skillsRequired: JSON.parse(role.skillsRequired),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /admin/jobs
 * Create new job posting
 */
router.post("/jobs", requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      company,
      location,
      salaryMin,
      salaryMax,
      roleId,
    } = req.body;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        company,
        location,
        salaryMin,
        salaryMax,
        roleId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: {
        role: true,
      },
    });

    res.json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /admin/export/users
 * Export all users data as JSON (GDPR compliance)
 */
router.get(
  "/export/users",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        include: {
          onboardingProfile: true,
          careerAnalysis: true,
          userFeedback: true,
        },
      });

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=users-export.json"
      );
      res.json({
        exportedAt: new Date().toISOString(),
        totalUsers: users.length,
        data: users,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /admin/ai/health
 * Check Gemini AI service health and availability
 * Use for monitoring and debugging AI scoring
 */
router.get("/ai/health", requireAdmin, async (req: Request, res: Response) => {
  try {
    const configured = isGeminiConfigured();

    if (!configured) {
      return res.json({
        success: true,
        data: {
          gemini: {
            configured: false,
            available: false,
            message: "GEMINI_API_KEY not set - using fallback scoring",
          },
          scoringMode: "fallback",
        },
      });
    }

    // Run health check
    const healthResult = await checkGeminiHealth();

    res.json({
      success: true,
      data: {
        gemini: {
          configured: true,
          available: healthResult.available,
          latencyMs: healthResult.latencyMs,
          error: healthResult.error,
        },
        scoringMode: healthResult.available ? "gemini" : "fallback",
        recommendation: healthResult.available
          ? "AI scoring is operational"
          : "AI scoring will fall back to deterministic algorithm",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /admin/ai/stats
 * Get statistics about AI-generated vs fallback JR scores
 */
router.get("/ai/stats", requireAdmin, async (req: Request, res: Response) => {
  try {
    // Count scores by source
    const [geminiScores, fallbackScores, cachedScores, totalScores] =
      await Promise.all([
        prisma.careerAnalysis.count({
          where: { jrSource: "gemini" },
        }),
        prisma.careerAnalysis.count({
          where: { jrSource: "fallback" },
        }),
        prisma.careerAnalysis.count({
          where: { jrSource: "cached" },
        }),
        prisma.careerAnalysis.count(),
      ]);

    // Average scores by source
    const [geminiAvg, fallbackAvg] = await Promise.all([
      prisma.careerAnalysis.aggregate({
        where: { jrSource: "gemini" },
        _avg: { jrScore: true },
      }),
      prisma.careerAnalysis.aggregate({
        where: { jrSource: "fallback" },
        _avg: { jrScore: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalScores,
        bySource: {
          gemini: {
            count: geminiScores,
            percentage:
              totalScores > 0
                ? Math.round((geminiScores / totalScores) * 100)
                : 0,
            averageScore: geminiAvg._avg?.jrScore || 0,
          },
          fallback: {
            count: fallbackScores,
            percentage:
              totalScores > 0
                ? Math.round((fallbackScores / totalScores) * 100)
                : 0,
            averageScore: fallbackAvg._avg?.jrScore || 0,
          },
          cached: {
            count: cachedScores,
            percentage:
              totalScores > 0
                ? Math.round((cachedScores / totalScores) * 100)
                : 0,
          },
        },
        health: {
          geminiConfigured: isGeminiConfigured(),
          recommendedAction: !isGeminiConfigured()
            ? "Set GEMINI_API_KEY to enable AI scoring"
            : "AI scoring operational",
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
