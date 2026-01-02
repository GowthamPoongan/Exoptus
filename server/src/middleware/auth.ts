import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Authentication middleware
 * Verifies JWT token and attaches userId to request
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const secret =
      process.env.JWT_SECRET ||
      "exoptus-dev-jwt-secret-change-in-production-12345";

    const decoded = jwt.verify(token, secret) as any;

    // Attach userId to request for use in route handlers
    (req as any).userId = decoded.userId || decoded.sub;

    next();
  } catch (error: any) {
    console.error("❌ Auth middleware error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
};
