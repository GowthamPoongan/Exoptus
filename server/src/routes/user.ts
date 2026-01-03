/**
 * User Routes
 *
 * Handles:
 * - Profile updates
 * - Onboarding status updates
 * - Onboarding step tracking
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { verifyToken, TokenPayload } from "../lib/jwt";
import { updateOnboardingProgress, getRedirectPath } from "../lib/onboarding";

const router = Router();

// Auth middleware
interface AuthRequest extends Request {
  user?: TokenPayload;
}

const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
};

// ============================================
// GET PROFILE
// ============================================
router.get(
  "/profile",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { profile: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          onboardingCompleted: user.onboardingCompleted,
          onboardingStep: user.onboardingStep,
          onboardingStatus: user.onboardingStatus,
          authProviders: user.authProviders.split(","),
          createdAt: user.createdAt,
          profile: user.profile || null,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to get profile",
      });
    }
  }
);

// ============================================
// UPDATE PROFILE
// ============================================
const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  avatar: z.string().url().optional(),
  college: z.string().max(200).optional(),
  course: z.string().max(200).optional(),
  year: z.number().int().positive().optional(),
  phone: z.string().max(30).optional(),
});

router.patch(
  "/profile",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const updates = updateProfileSchema.parse(req.body);

      // Update User basic fields if present
      const userUpdates: any = {};
      if (updates.name) userUpdates.name = updates.name;
      if (updates.avatar) userUpdates.avatar = updates.avatar;

      if (Object.keys(userUpdates).length > 0) {
        await prisma.user.update({
          where: { id: req.user!.userId },
          data: userUpdates,
        });
      }

      // Upsert Profile record
      const profile = await prisma.profile.upsert({
        where: { userId: req.user!.userId },
        create: {
          userId: req.user!.userId,
          name: updates.name || null,
          college: updates.college || null,
          course: updates.course || null,
          year: updates.year || null,
          phone: updates.phone || null,
        },
        update: {
          name: updates.name || undefined,
          college: updates.college || undefined,
          course: updates.course || undefined,
          year: updates.year || undefined,
          phone: updates.phone || undefined,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { profile: true },
      });

      res.json({
        success: true,
        data: {
          id: user!.id,
          email: user!.email,
          name: user!.name,
          avatar: user!.avatar,
          emailVerified: user!.emailVerified,
          onboardingCompleted: user!.onboardingCompleted,
          onboardingStep: user!.onboardingStep,
          onboardingStatus: user!.onboardingStatus,
          authProviders: user!.authProviders.split(","),
          profile: user!.profile || profile,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors[0].message,
        });
      }

      console.error("Profile update error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update profile",
      });
    }
  }
);

// ============================================
// UPDATE ONBOARDING STATUS (Legacy)
// ============================================
const updateOnboardingSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed"]),
  data: z.record(z.any()).optional(), // Optional onboarding data
});

router.patch(
  "/onboarding",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, data } = updateOnboardingSchema.parse(req.body);

      const updateData: any = {
        onboardingStatus: status,
      };

      if (data) {
        updateData.onboardingData = JSON.stringify(data);
      }

      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: updateData,
      });

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          onboardingStatus: user.onboardingStatus,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors[0].message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to update onboarding status",
      });
    }
  }
);

// ============================================
// COMPLETE ONBOARDING STEP (New)
// ============================================
const completeStepSchema = z.object({
  step: z.string(),
  data: z.record(z.any()).optional(), // Optional step data
});

router.post(
  "/onboarding/step/complete",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { step, data } = completeStepSchema.parse(req.body);

      // Update onboarding progress
      const user = await updateOnboardingProgress(req.user!.userId, step);

      // Optionally save step data
      if (data) {
        const existingData = user.onboardingData
          ? JSON.parse(user.onboardingData)
          : {};
        const updatedData = { ...existingData, [step]: data };

        await prisma.user.update({
          where: { id: user.id },
          data: { onboardingData: JSON.stringify(updatedData) },
        });
      }

      // Get redirect path for next step
      const redirectPath = getRedirectPath(user);

      res.json({
        success: true,
        data: {
          completed: user.onboardingCompleted,
          nextStep: user.onboardingStep,
          redirectTo: redirectPath,
          user: {
            id: user.id,
            email: user.email,
            onboardingCompleted: user.onboardingCompleted,
            onboardingStep: user.onboardingStep,
          },
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: error.errors[0].message,
        });
      }

      console.error("Onboarding step error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to complete onboarding step",
      });
    }
  }
);

// ============================================
// GET ONBOARDING STATUS
// ============================================
router.get(
  "/onboarding/status",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const redirectPath = getRedirectPath(user);

      res.json({
        success: true,
        data: {
          completed: user.onboardingCompleted,
          currentStep: user.onboardingStep,
          lastCompletedStep: user.lastCompletedStep,
          redirectTo: redirectPath,
          onboardingData: user.onboardingData
            ? JSON.parse(user.onboardingData)
            : null,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to get onboarding status",
      });
    }
  }
);

export default router;
