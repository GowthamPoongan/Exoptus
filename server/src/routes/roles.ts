import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /roles
 * Get all available roles with optional filtering
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, difficulty, minSalary, maxSalary, search } = req.query;

    let whereClause: any = {};

    if (category) {
      whereClause.category = String(category);
    }

    if (difficulty) {
      whereClause.difficulty = String(difficulty);
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
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

    const roles = await prisma.role.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: { demandLevel: "desc" },
    });

    // Parse skillsRequired from JSON string
    const formattedRoles = roles.map((role) => ({
      ...role,
      skillsRequired: JSON.parse(role.skillsRequired),
    }));

    res.json({
      success: true,
      data: formattedRoles,
      count: formattedRoles.length,
    });
  } catch (error: any) {
    console.error("❌ Error fetching roles:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch roles",
    });
  }
});

/**
 * GET /roles/:id
 * Get single role with details
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salaryMin: true,
            salaryMax: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Role not found",
      });
    }

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
 * GET /roles/matches/:userId
 * Get role recommendations for user based on their onboarding data
 */
router.get(
  "/matches/:userId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Get user's onboarding profile
      const onboardingProfile = await prisma.onboardingProfile.findUnique({
        where: { userId },
      });

      if (!onboardingProfile) {
        return res.status(404).json({
          success: false,
          error: "Onboarding profile not found",
        });
      }

      // Get user's analysis
      const analysis = await prisma.careerAnalysis.findUnique({
        where: { userId },
      });

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: "Career analysis not found",
        });
      }

      // Get matched roles
      const matchedRoleIds =
        analysis.matchedRoleIds?.split(",").filter(Boolean) || [];

      const matchedRoles = await prisma.role.findMany({
        where: {
          id: { in: matchedRoleIds },
        },
      });

      const formattedRoles = matchedRoles.map((role) => ({
        ...role,
        skillsRequired: JSON.parse(role.skillsRequired),
      }));

      res.json({
        success: true,
        data: formattedRoles,
        topRole: analysis.topRole,
        topRoleMatch: analysis.topRoleMatch,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
