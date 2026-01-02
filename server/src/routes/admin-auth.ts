import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET =
  process.env.JWT_SECRET || "exoptus-admin-secret-key-change-in-production";
const TOKEN_EXPIRY = "7d"; // 7 days

// ============================================
// POST /admin/auth/login - Admin Login
// ============================================
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find admin user
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is disabled. Contact super admin.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Create admin session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        token,
        expiresAt,
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        deviceInfo: req.headers["user-agent"] || "unknown",
      },
    });

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Log the login
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "admin_login",
        details: JSON.stringify({ method: "password", success: true }),
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
      },
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
});

// ============================================
// POST /admin/auth/logout - Admin Logout
// ============================================
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const token = req.headers["x-admin-token"] as string;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    // Delete session
    const session = await prisma.adminSession.findUnique({
      where: { token },
    });

    if (session) {
      await prisma.adminSession.delete({
        where: { token },
      });

      // Log the logout
      await prisma.adminLog.create({
        data: {
          adminId: session.adminId,
          action: "admin_logout",
          details: JSON.stringify({ method: "manual" }),
          ipAddress: req.ip || req.socket.remoteAddress || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
        },
      });
    }

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
});

// ============================================
// GET /admin/auth/session - Validate Session
// ============================================
router.get("/session", async (req: Request, res: Response) => {
  try {
    const token = req.headers["x-admin-token"] as string;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Check if session exists and not expired
    const session = await prisma.adminSession.findUnique({
      where: { token },
      include: { admin: true },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.adminSession.delete({
        where: { token },
      });

      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    if (!session.admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is disabled",
      });
    }

    res.json({
      success: true,
      message: "Session is valid",
      data: {
        admin: {
          id: session.admin.id,
          email: session.admin.email,
          name: session.admin.name,
          role: session.admin.role,
        },
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("Admin session validation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during session validation",
    });
  }
});

// ============================================
// GET /admin/auth/logs - Get Admin Activity Logs
// ============================================
router.get("/logs", async (req: Request, res: Response) => {
  try {
    const token = req.headers["x-admin-token"] as string;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await prisma.adminLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    const totalLogs = await prisma.adminLog.count();

    res.json({
      success: true,
      data: logs,
      meta: {
        total: totalLogs,
        limit,
        offset,
        hasMore: offset + limit < totalLogs,
      },
    });
  } catch (error) {
    console.error("Admin logs error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error fetching logs",
    });
  }
});

export default router;
