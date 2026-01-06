/**
 * EXOPTUS Backend Server
 *
 * Production-ready authentication system with:
 * - Email magic link verification
 * - Google OAuth
 * - PostgreSQL with Prisma
 * - JWT session management
 */

import dotenv from "dotenv";

// Load environment variables first so imported modules see them
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import onboardingRoutes from "./routes/onboarding";
import rolesRoutes from "./routes/roles";
import jobsRoutes from "./routes/jobs";
import adminRoutes from "./routes/admin";
import adminAuthRoutes from "./routes/admin-auth";
import communityRoutes from "./routes/community";
import dashboardRoutes from "./routes/dashboard";
import { verifySmtpConnection } from "./lib/email";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/onboarding", onboardingRoutes);
app.use("/roles", rolesRoutes);
app.use("/jobs", jobsRoutes);
app.use("/admin", adminRoutes);
app.use("/admin/auth", adminAuthRoutes);
app.use("/community", communityRoutes);
app.use("/dashboard", dashboardRoutes);

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
);

// Start server - listen on all interfaces (0.0.0.0) for mobile access
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 EXOPTUS Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Network access: http://0.0.0.0:${PORT}`);

  // Verify SMTP connection on startup
  await verifySmtpConnection();
});

export default app;
