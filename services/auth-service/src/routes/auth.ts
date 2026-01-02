/**
 * Authentication Routes
 *
 * Handles:
 * - Email magic link flow
 * - Google OAuth flow
 * - Account linking
 * - Session management
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import {
  generateToken,
  generateSecureToken,
  getMagicLinkExpiry,
  getSessionExpiry,
  verifyToken,
} from "../lib/jwt";
import { sendMagicLinkEmail } from "../lib/email";
import { verifyGoogleToken } from "../lib/google";
import {
  getRedirectPath,
  addAuthProvider,
  hasAuthProvider,
  ONBOARDING_STEPS,
} from "../lib/onboarding";

const router = Router();

// ============================================
// EMAIL MAGIC LINK - START
// ============================================
const emailStartSchema = z.object({
  email: z.string().email("Invalid email address"),
});

router.post("/email/start", async (req: Request, res: Response) => {
  try {
    // Validate input
    const { email } = emailStartSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          authProviders: "email",
          createdWith: "email",
          emailVerified: false,
          onboardingCompleted: false,
          onboardingStep: ONBOARDING_STEPS[0], // Start at first step
          onboardingStatus: "not_started",
        },
      });
      console.log(`✨ New user created: ${normalizedEmail}`);
    }

    // Generate magic link token
    const token = generateSecureToken();

    // Store token in database
    await prisma.emailVerificationToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt: getMagicLinkExpiry(),
        userId: user.id,
      },
    });

    // Send email
    const emailSent = await sendMagicLinkEmail(normalizedEmail, token);

    if (!emailSent && process.env.NODE_ENV !== "development") {
      throw new Error("Failed to send verification email");
    }

    res.json({
      message: "Verification email sent",
      email: normalizedEmail,
    });
  } catch (error: any) {
    console.error("Email start error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to send verification email",
    });
  }
});

// ============================================
// EMAIL MAGIC LINK - VERIFY
// ============================================
const emailVerifySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

router.post("/email/verify", async (req: Request, res: Response) => {
  try {
    const { token } = emailVerifySchema.parse(req.body);

    // Find token in database
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    // Validate token
    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        error: "Invalid verification link",
      });
    }

    if (verificationToken.used) {
      return res.status(400).json({
        success: false,
        error: "This link has already been used",
      });
    }

    if (verificationToken.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: "This link has expired. Please request a new one.",
      });
    }

    // Mark token as used
    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true },
    });

    // Update user
    const user = await prisma.user.update({
      where: { email: verificationToken.email },
      data: {
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    });

    // Create session
    const sessionToken = generateSecureToken();
    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt: getSessionExpiry(),
      },
    });

    // Generate JWT
    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    console.log(
      `✅ User verified: ${user.email} (onboarding: ${
        user.onboardingCompleted ? "complete" : user.onboardingStep
      })`
    );

    // Get redirect path based on onboarding status
    const redirectPath = getRedirectPath(user);

    res.json({
      success: true,
      data: {
        token: jwtToken,
        redirectTo: redirectPath,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          onboardingCompleted: user.onboardingCompleted,
          onboardingStep: user.onboardingStep,
          onboardingStatus: user.onboardingStatus,
          authProviders: user.authProviders.split(","),
        },
      },
    });
  } catch (error: any) {
    console.error("Email verify error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Verification failed",
    });
  }
});

// ============================================
// WEB REDIRECT - For testing magic links
// ============================================
router.get("/verify-redirect", async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>❌ Invalid Link</h1>
          <p>This verification link is invalid or has expired.</p>
        </body>
      </html>
    `);
  }

  // For development build (custom scheme with proper route)
  const devBuildLink = `exoptus://(auth)/verifying?token=${token}`;

  // For Expo Go development (needs /-- prefix)
  const expoDevUrl = process.env.EXPO_DEV_URL || "exp://localhost:8081";
  const expoGoLink = `${expoDevUrl}/--(auth)/verifying?token=${token}`;

  // For production (standalone app with proper route)
  const appUrl = process.env.APP_URL || "exoptus://";
  const prodLink = `${appUrl}(auth)/verifying?token=${token}`;

  // Use dev build link for development (works with exoptus:// custom scheme)
  const deepLink =
    process.env.NODE_ENV === "production" ? prodLink : devBuildLink;

  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: system-ui; padding: 40px 20px; text-align: center; background: #f5f5f5; margin: 0; }
          .card { background: white; padding: 40px 24px; border-radius: 16px; max-width: 400px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          h1 { color: #0066FF; margin-bottom: 16px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #0066FF 0%, #3B82F6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; margin: 16px 0; }
          .btn:active { opacity: 0.9; }
          .links { margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; }
          .link { display: block; color: #666; font-size: 14px; margin: 8px 0; word-break: break-all; }
          code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ Verify Your Account</h1>
          <p>Tap the button below to open the Exoptus app and complete verification.</p>
          
          <a href="${deepLink}" class="btn">Open Exoptus App</a>
          
          <div class="links">
            <p style="color: #999; font-size: 12px; margin-bottom: 12px;">If the button doesn't work, try these links:</p>
            <a href="${devBuildLink}" class="link">📱 Dev Build: <code>exoptus://...</code></a>
            <a href="${expoGoLink}" class="link">🔵 Expo Go: <code>exp://...</code></a>
            <a href="${prodLink}" class="link">🚀 Production: <code>exoptus://...</code></a>
          </div>
        </div>
      </body>
    </html>
  `);
});

// ============================================
// GOOGLE OAUTH - Server-side flow (for Expo Go)
// ============================================

// Start Google OAuth - redirects user to Google login
router.get("/google/start", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${
    process.env.SERVER_URL || "http://localhost:3000"
  }/auth/google/callback`;

  // Get the app redirect URL from query params (for deep linking back)
  const appRedirect = (req.query.redirect as string) || "";

  const state = Buffer.from(JSON.stringify({ appRedirect })).toString("base64");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId!);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("prompt", "consent");

  console.log(`🔵 Starting Google OAuth, redirect_uri: ${redirectUri}`);
  res.redirect(googleAuthUrl.toString());
});

// Google OAuth callback - exchanges code for tokens
router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error("Google OAuth error:", error);
      return res.redirect(`${getAppDeepLink()}?error=${error}`);
    }

    if (!code || typeof code !== "string") {
      return res.redirect(`${getAppDeepLink()}?error=no_code`);
    }

    // Parse state to get app redirect URL
    let appRedirect = "";
    try {
      const stateData = JSON.parse(
        Buffer.from(state as string, "base64").toString()
      );
      appRedirect = stateData.appRedirect || "";
    } catch (e) {
      // Ignore state parse errors
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${
      process.env.SERVER_URL || "http://localhost:3000"
    }/auth/google/callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      id_token?: string;
      error?: string;
    };

    if (!tokenData.id_token) {
      console.error("No ID token in response:", tokenData);
      return res.redirect(`${getAppDeepLink(appRedirect)}?error=no_token`);
    }

    // Verify the ID token
    const googleUser = await verifyGoogleToken(tokenData.id_token);

    if (!googleUser) {
      return res.redirect(`${getAppDeepLink(appRedirect)}?error=invalid_token`);
    }

    const normalizedEmail = googleUser.email.toLowerCase().trim();

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // NEW USER - Create account with Google
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: googleUser.name,
          avatar: googleUser.picture,
          authProviders: "google",
          createdWith: "google",
          googleId: googleUser.googleId,
          emailVerified: true,
          onboardingCompleted: false,
          onboardingStep: ONBOARDING_STEPS[0],
          onboardingStatus: "not_started",
        },
      });
      console.log(`✨ New Google user created: ${normalizedEmail}`);
    } else if (!hasAuthProvider(user, "google")) {
      // ACCOUNT LINKING
      user = await addAuthProvider(user.id, "google", {
        googleId: googleUser.googleId,
      });

      const updates: any = { lastLoginAt: new Date() };
      if (!user.name && googleUser.name) updates.name = googleUser.name;
      if (!user.avatar && googleUser.picture)
        updates.avatar = googleUser.picture;

      user = await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      console.log(`🔗 Google account linked: ${normalizedEmail}`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || googleUser.name,
          avatar: user.avatar || googleUser.picture,
          lastLoginAt: new Date(),
        },
      });
      console.log(`✅ Google user signed in: ${normalizedEmail}`);
    }

    // Create session
    const sessionToken = generateSecureToken();
    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt: getSessionExpiry(),
      },
    });

    // Generate JWT
    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    console.log(`✅ Google OAuth complete: ${user.email}`);

    // Show success page with deep link to app (works from localhost on phone browser)
    const expoDevUrl = process.env.EXPO_DEV_URL || "exp://localhost:8081";
    const appScheme = process.env.APP_SCHEME || "exoptus";

    const expoLink = `${expoDevUrl}/--/google-callback?token=${jwtToken}&success=true`;
    const prodLink = `${appScheme}://google-callback?token=${jwtToken}&success=true`;

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign In Successful</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .card {
              background: white;
              border-radius: 20px;
              padding: 40px;
              text-align: center;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 350px;
              margin: 20px;
            }
            .success-icon {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
              font-size: 40px;
            }
            h1 { color: #1a1a2e; margin: 0 0 12px; font-size: 24px; }
            p { color: #666; margin: 0 0 24px; font-size: 16px; }
            .email { 
              background: #f0f0f0; 
              padding: 8px 16px; 
              border-radius: 8px; 
              font-size: 14px;
              color: #333;
              margin-bottom: 24px;
              display: inline-block;
            }
            .btn {
              display: block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              margin: 8px 0;
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4); }
            .btn-secondary {
              background: #f0f0f0;
              color: #333;
            }
            .btn-secondary:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
            .divider { 
              margin: 16px 0; 
              color: #999; 
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success-icon">✓</div>
            <h1>Welcome, ${user.name || "there"}!</h1>
            <p>You've successfully signed in with Google</p>
            <div class="email">${user.email}</div>
            
            <a href="${expoLink}" class="btn">📱 Open Exoptus App</a>
            
            <div class="divider">— or if that doesn't work —</div>
            
            <a href="${prodLink}" class="btn btn-secondary">Open Production App</a>
          </div>
          
          <script>
            // Try to auto-open the app after a short delay
            setTimeout(() => {
              window.location.href = "${expoLink}";
            }, 1500);
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Google OAuth callback error:", error);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign In Error</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex; justify-content: center; align-items: center;
              min-height: 100vh; margin: 0; background: #f5f5f5;
            }
            .card { background: white; border-radius: 20px; padding: 40px; text-align: center; max-width: 350px; }
            h1 { color: #e74c3c; }
            a { color: #667eea; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>❌ Sign In Failed</h1>
            <p>Something went wrong. Please try again.</p>
            <p><a href="/">Go back</a></p>
          </div>
        </body>
      </html>
    `);
  }
});

// Helper to get the app deep link URL
function getAppDeepLink(customPath: string = ""): string {
  const expoDevUrl = process.env.EXPO_DEV_URL || "exp://localhost:8081";
  const appScheme = process.env.APP_SCHEME || "exoptus";

  // For development (Expo Go)
  if (process.env.NODE_ENV !== "production") {
    return `${expoDevUrl}/--/google-callback`;
  }

  // For production (standalone app)
  return `${appScheme}://google-callback`;
}

// ============================================
// GOOGLE OAUTH - POST endpoint (for ID token from client)
// ============================================
const googleAuthSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

router.post("/google", async (req: Request, res: Response) => {
  try {
    const { idToken } = googleAuthSchema.parse(req.body);

    // Verify Google token
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser) {
      return res.status(400).json({
        success: false,
        error: "Invalid Google token",
      });
    }

    const normalizedEmail = googleUser.email.toLowerCase().trim();

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // NEW USER - Create account with Google
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: googleUser.name,
          avatar: googleUser.picture,
          authProviders: "google",
          createdWith: "google",
          googleId: googleUser.googleId,
          emailVerified: true, // Google users are auto-verified
          onboardingCompleted: false,
          onboardingStep: ONBOARDING_STEPS[0],
          onboardingStatus: "not_started",
        },
      });
      console.log(`✨ New Google user created: ${normalizedEmail}`);
    } else if (!hasAuthProvider(user, "google")) {
      // ACCOUNT LINKING - User exists but signed up with email
      // Auto-link since Google verified the email
      user = await addAuthProvider(user.id, "google", {
        googleId: googleUser.googleId,
      });

      // Update profile info if not set
      const updates: any = { lastLoginAt: new Date() };
      if (!user.name && googleUser.name) updates.name = googleUser.name;
      if (!user.avatar && googleUser.picture)
        updates.avatar = googleUser.picture;

      user = await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      console.log(`🔗 Google account linked: ${normalizedEmail}`);
    } else {
      // User already has Google linked - just update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || googleUser.name,
          avatar: user.avatar || googleUser.picture,
          lastLoginAt: new Date(),
        },
      });
      console.log(`✅ Google user signed in: ${normalizedEmail}`);
    }

    // Create session
    const sessionToken = generateSecureToken();
    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt: getSessionExpiry(),
      },
    });

    // Generate JWT
    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    console.log(
      `✅ Google auth complete: ${user.email} (onboarding: ${
        user.onboardingCompleted ? "complete" : user.onboardingStep
      })`
    );

    // Get redirect path based on onboarding status
    const redirectPath = getRedirectPath(user);

    // Check if user is returning with existing data
    const isReturningUser =
      user.onboardingStatus === "in_progress" ||
      user.onboardingStatus === "completed" ||
      user.onboardingCompleted ||
      (user.onboardingStep && user.onboardingStep !== ONBOARDING_STEPS[0]) ||
      user.onboardingData !== null;

    res.json({
      success: true,
      data: {
        token: jwtToken,
        redirectTo: redirectPath,
        isReturningUser,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          onboardingCompleted: user.onboardingCompleted,
          onboardingStep: user.onboardingStep,
          onboardingStatus: user.onboardingStatus,
          authProviders: user.authProviders.split(","),
        },
      },
    });
  } catch (error: any) {
    console.error("Google auth error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Google authentication failed",
    });
  }
});

// ============================================
// CHECK SESSION
// ============================================
router.get("/session", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
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

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if session is still valid
    const session = await prisma.authSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: "Session expired",
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          onboardingCompleted: user.onboardingCompleted,
          onboardingStep: user.onboardingStep,
          onboardingStatus: user.onboardingStatus,
          authProviders: user.authProviders.split(","),
        },
      },
    });
  } catch (error: any) {
    console.error("Session check error:", error);
    res.status(500).json({
      success: false,
      error: "Session check failed",
    });
  }
});

// ============================================
// LOGOUT
// ============================================
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({ success: true });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    if (payload) {
      // Delete session
      await prisma.authSession
        .delete({
          where: { id: payload.sessionId },
        })
        .catch(() => {}); // Ignore if already deleted
    }

    res.json({ success: true });
  } catch (error) {
    res.json({ success: true });
  }
});

// ============================================
// RESET ONBOARDING (Fresh Start)
// ============================================
router.post("/reset-onboarding", async (req: Request, res: Response) => {
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
        error: "Invalid token",
      });
    }

    // Reset user's onboarding data
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        onboardingCompleted: false,
        onboardingStep: ONBOARDING_STEPS[0], // Reset to first step
        onboardingStatus: "not_started",
        lastCompletedStep: null,
        onboardingData: null, // Clear any saved data
        onboardingCompletedAt: null,
      },
    });

    console.log(`🔄 Onboarding reset for user: ${updatedUser.email}`);

    res.json({
      success: true,
      message: "Onboarding reset successfully",
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          onboardingCompleted: updatedUser.onboardingCompleted,
          onboardingStep: updatedUser.onboardingStep,
          onboardingStatus: updatedUser.onboardingStatus,
        },
      },
    });
  } catch (error: any) {
    console.error("Reset onboarding error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset onboarding",
    });
  }
});

// ============================================
// WEB REDIRECT (for testing magic links in browser)
// ============================================
router.get("/verify-redirect", (req: Request, res: Response) => {
  const { token } = req.query;
  const appUrl = process.env.APP_URL || "exoptus://";
  res.redirect(`${appUrl}verify?token=${token}`);
});

export default router;
