/**
 * EXOPTUS Backend Server
 *
 * Production-ready authentication system with:
 * - Email magic link verification
 * - Google OAuth
 * - PostgreSQL with Prisma
 * - JWT session management
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";

// Load environment variables
dotenv.config();

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
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 EXOPTUS Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Mobile access: http://<YOUR_IP>:${PORT} (set API_URL in .env)`);
});

export default app;
