import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /jobs
 * Get jobs with filtering and search
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      roleId,
      location,
      minSalary,
      maxSalary,
      search,
      limit = "20",
      offset = "0",
    } = req.query;

    let whereClause: any = {
      expiresAt: {
        gt: new Date(), // Only active jobs
      },
    };

    if (roleId) {
      whereClause.roleId = String(roleId);
    }

    if (location) {
      whereClause.location = {
        contains: String(location),
        mode: "insensitive",
      };
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { company: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
      ];
    }

    if (minSalary || maxSalary) {
      whereClause.AND = [];
      if (minSalary) {
        whereClause.AND.push({
          salaryMax: { gte: parseInt(String(minSalary)) },
        });
      }
      if (maxSalary) {
        whereClause.AND.push({
          salaryMin: { lte: parseInt(String(maxSalary)) },
        });
      }
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        role: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: { postedAt: "desc" },
      take: parseInt(String(limit)),
      skip: parseInt(String(offset)),
    });

    const total = await prisma.job.count({ where: whereClause });

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
    console.error("❌ Error fetching jobs:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch jobs",
    });
  }
});

/**
 * GET /jobs/:id
 * Get single job details
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    // Parse role skills if present
    const jobData = {
      ...job,
      role: job.role
        ? {
            ...job.role,
            skillsRequired: JSON.parse(job.role.skillsRequired),
          }
        : null,
    };

    res.json({
      success: true,
      data: jobData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /jobs/recommended/:userId
 * Get job recommendations for a user based on their profile
 */
router.get("/recommended/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = "10" } = req.query;

    // Get user's onboarding profile
    const onboardingProfile = await prisma.onboardingProfile.findUnique({
      where: { userId },
    });

    if (!onboardingProfile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found",
      });
    }

    // Get user's analysis for matched roles
    const analysis = await prisma.careerAnalysis.findUnique({
      where: { userId },
    });

    if (!analysis || !analysis.matchedRoleIds) {
      // If no analysis, return general high-demand jobs
      const jobs = await prisma.job.findMany({
        where: {
          expiresAt: { gt: new Date() },
        },
        include: {
          role: {
            select: {
              id: true,
              title: true,
              category: true,
              demandLevel: true,
            },
          },
        },
        take: parseInt(String(limit)),
        orderBy: { postedAt: "desc" },
      });

      return res.json({
        success: true,
        data: jobs,
        note: "General recommendations (no profile analysis found)",
      });
    }

    // Get jobs for matched roles
    const matchedRoleIds = analysis.matchedRoleIds.split(",").filter(Boolean);

    const jobs = await prisma.job.findMany({
      where: {
        roleId: { in: matchedRoleIds },
        expiresAt: { gt: new Date() },
      },
      include: {
        role: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      take: parseInt(String(limit)),
      orderBy: { postedAt: "desc" },
    });

    res.json({
      success: true,
      data: jobs,
      recommendations: {
        topRole: analysis.topRole,
        matchPercentage: analysis.topRoleMatch,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching recommended jobs:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch recommendations",
    });
  }
});

export default router;
