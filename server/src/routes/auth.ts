/**
 * Authentication Routes
 *
 * Handles:
 * - Email magic link flow (production-ready with Resend)
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
  hashToken,
  getMagicLinkExpiry,
  getSessionExpiry,
  verifyToken,
} from "../lib/jwt";
import { sendMagicLinkEmail, canSendMagicLink } from "../lib/email";
import { verifyGoogleToken } from "../lib/google";
import {
  getRedirectPath,
  addAuthProvider,
  hasAuthProvider,
  ONBOARDING_STEPS,
} from "../lib/onboarding";
import { jwtVerify, importSPKI } from "jose";

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

    // Check rate limiting - prevent spam
    const throttleCheck = await canSendMagicLink(normalizedEmail, prisma);
    if (!throttleCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Please wait ${throttleCheck.waitSeconds} seconds before requesting another link`,
        retryAfter: throttleCheck.waitSeconds,
      });
    }

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
          onboardingStep: ONBOARDING_STEPS[0],
          onboardingStatus: "not_started",
        },
      });
    }

    // Generate secure magic link token
    const rawToken = generateSecureToken();
    const hashedToken = hashToken(rawToken);

    console.log(`✉️ Generating magic link for ${normalizedEmail}`);
    console.log(`Raw token length: ${rawToken.length}`);
    console.log(`Raw token (first 20 chars): ${rawToken.substring(0, 20)}`);
    console.log(
      `Hashed token (first 20 chars): ${hashedToken.substring(0, 20)}`
    );

    // Store HASHED token in database (raw token goes to user email)
    await prisma.emailVerificationToken.create({
      data: {
        email: normalizedEmail,
        token: hashedToken,
        expiresAt: getMagicLinkExpiry(),
        userId: user.id,
      },
    });

    console.log(`✅ Token stored in DB for ${normalizedEmail}`);

    // Send email with RAW token (user clicks this)
    const emailSent = await sendMagicLinkEmail(normalizedEmail, rawToken);

    if (!emailSent) {
      // Clean up the token if email failed
      await prisma.emailVerificationToken.deleteMany({
        where: { token: hashedToken },
      });
      throw new Error("Failed to send verification email");
    }

    res.json({
      success: true,
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
// EMAIL MAGIC LINK - VERIFY (GET - from email link)
// ============================================
// This handles clicks from the email - redirects to mobile app deep link
router.get("/email/verify", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Link</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   padding: 40px; text-align: center; background: #f5f5f5; }
            .container { max-width: 400px; margin: 0 auto; background: white; 
                        padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            h1 { color: #dc2626; margin-bottom: 16px; }
            p { color: #6b7280; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Link</h1>
            <p>This verification link is invalid or expired. Please request a new one.</p>
          </div>
        </body>
        </html>
      `);
    }

    console.log(
      `📧 Email verification link clicked - verifying and redirecting to app`
    );

    // FAST PATH: Verify token on server immediately, pass JWT to app
    // This avoids slow POST request from mobile app
    try {
      const hashedToken = hashToken(token);
      const verificationToken = await prisma.emailVerificationToken.findFirst({
        where: { token: hashedToken },
        include: { user: true },
      });

      // If token is valid and not expired, create session immediately
      if (
        verificationToken &&
        !verificationToken.used &&
        verificationToken.expiresAt > new Date()
      ) {
        // Delete token (single-use)
        await prisma.emailVerificationToken.delete({
          where: { id: verificationToken.id },
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
        const hashedSessionToken = hashToken(sessionToken);
        const session = await prisma.authSession.create({
          data: {
            userId: user.id,
            sessionToken: hashedSessionToken,
            expiresAt: getSessionExpiry(),
          },
        });

        // Generate JWT
        const jwtToken = generateToken({
          userId: user.id,
          email: user.email,
          sessionId: session.id,
        });

        // Get redirect path
        const redirectPath = getRedirectPath(user);

        console.log(`✅ Email verified for ${user.email} - passing JWT to app`);

        // Pass JWT and user directly to app (no POST needed!)
        // For Expo development: use exp:// URL format
        const expUrl = process.env.EXPO_DEV_URL || "exp://192.168.1.22:8081";
        const deepLink = `${expUrl}/--/auth/verify?jwt=${encodeURIComponent(
          jwtToken
        )}&user=${encodeURIComponent(
          JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            emailVerified: user.emailVerified,
            onboardingCompleted: user.onboardingCompleted,
            onboardingStep: user.onboardingStep,
            onboardingStatus: user.onboardingStatus,
            authProviders: user.authProviders.split(","),
          })
        )}&redirectTo=${encodeURIComponent(redirectPath)}`;

        // Return HTML that redirects to the app
        res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verified - Opening Exoptus</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            max-width: 400px; 
            width: 100%;
            background: white; 
            padding: 48px 32px;
            border-radius: 24px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
          }
          .checkmark { 
            width: 80px; 
            height: 80px; 
            margin: 0 auto 24px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          @keyframes scaleIn {
            0% { transform: scale(0); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          .checkmark svg {
            width: 48px;
            height: 48px;
            stroke: white;
            stroke-width: 4;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
            animation: drawCheck 0.6s ease-in 0.2s forwards;
            stroke-dasharray: 60;
            stroke-dashoffset: 60;
          }
          @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
          }
          h1 { 
            color: #1f2937; 
            margin-bottom: 12px; 
            font-size: 28px;
            font-weight: 700;
          }
          p { 
            color: #6b7280; 
            line-height: 1.6; 
            margin-bottom: 32px;
            font-size: 16px;
          }
          .open-button { 
            display: block;
            width: 100%;
            padding: 18px 24px; 
            background: linear-gradient(135deg, #A855F7 0%, #7C3AED 100%);
            color: white; 
            text-decoration: none; 
            border-radius: 16px; 
            font-weight: 600;
            font-size: 18px;
            border: none;
            cursor: pointer;
            box-shadow: 0 8px 16px rgba(168, 85, 247, 0.3);
            transition: all 0.2s;
          }
          .open-button:active {
            transform: scale(0.98);
            box-shadow: 0 4px 8px rgba(168, 85, 247, 0.3);
          }
          .hint {
            margin-top: 16px;
            font-size: 13px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="checkmark">
            <svg viewBox="0 0 52 52">
              <polyline points="14 27 22 34 38 18"/>
            </svg>
          </div>
          <h1>✓ Email Verified!</h1>
          <p>Your email has been verified successfully.</p>
          <a href="${deepLink}" class="open-button" id="openApp">
            Open Exoptus App
          </a>
          <p class="hint">Tap the button to continue in the app</p>
        </div>
        <script>
          // Try automatic redirect after a short delay
          setTimeout(() => {
            window.location.href = '${deepLink}';
          }, 500);
          
          // Also try when user interacts
          document.getElementById('openApp').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '${deepLink}';
            // Fallback for browsers that block the redirect
            setTimeout(() => {
              window.open('${deepLink}', '_blank');
            }, 250);
          });
        </script>
      </body>
      </html>
        `);
        return;
      }
    } catch (verifyError) {
      console.error("Fast verification failed:", verifyError);
      // Fall through to fallback flow with token
    }

    // FALLBACK: Pass token to app for POST verification
    const expUrl = process.env.EXPO_DEV_URL || "exp://192.168.1.22:8081";
    const deepLink = `${expUrl}/--/auth/verify?token=${encodeURIComponent(
      token
    )}`;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Opening Exoptus</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="refresh" content="0;url=${deepLink}">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                 padding: 40px; text-align: center; background: #f5f5f5; }
          .container { max-width: 400px; margin: 0 auto; background: white; 
                      padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .logo { width: 64px; height: 64px; margin: 0 auto 24px; background: linear-gradient(135deg, #A855F7 0%, #7C3AED 100%); 
                 border-radius: 16px; display: flex; align-items: center; justify-content: center;
                 font-size: 32px; font-weight: 700; color: white; }
          h1 { color: #1f2937; margin-bottom: 16px; font-size: 24px; }
          p { color: #6b7280; line-height: 1.6; margin-bottom: 24px; }
          .spinner { width: 40px; height: 40px; margin: 24px auto; 
                    border: 4px solid #e5e7eb; border-top-color: #A855F7; 
                    border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .manual-link { display: inline-block; margin-top: 16px; padding: 12px 24px; 
                        background: #A855F7; color: white; text-decoration: none; 
                        border-radius: 8px; font-weight: 500; }
          .manual-link:hover { background: #9333EA; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">E</div>
          <h1>Opening Exoptus...</h1>
          <p>You're being redirected to the Exoptus app to complete sign-in.</p>
          <div class="spinner"></div>
          <p style="font-size: 14px; color: #9ca3af; margin-top: 24px;">
            If the app doesn't open automatically:
          </p>
          <a href="${deepLink}" class="manual-link">Open Exoptus App</a>
        </div>
        <script>
          // Fallback redirect after 2 seconds
          setTimeout(() => {
            window.location.href = '${deepLink}';
          }, 2000);
        </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Email verify GET error:", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                 padding: 40px; text-align: center; background: #f5f5f5; }
          .container { max-width: 400px; margin: 0 auto; background: white; 
                      padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          h1 { color: #dc2626; margin-bottom: 16px; }
          p { color: #6b7280; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Something went wrong</h1>
          <p>Please try requesting a new verification link.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// ============================================
// EMAIL MAGIC LINK - VERIFY (POST - from mobile app)
// ============================================
const emailVerifySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

router.post("/email/verify", async (req: Request, res: Response) => {
  try {
    const { token } = emailVerifySchema.parse(req.body);

    console.log("📧 Email verify POST request received");
    console.log("Token received:", token);
    console.log("Token length:", token.length);
    console.log("Token type:", typeof token);

    // Hash the incoming token to match stored hash
    const hashedToken = hashToken(token);
    console.log("Hashed token:", hashedToken);

    // Find token in database using hashed value
    // Use findFirst instead of findUnique for more reliable queries
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: { token: hashedToken },
      include: { user: true },
    });

    console.log("Token found in DB:", !!verificationToken);
    if (!verificationToken) {
      // Debug: check if ANY tokens exist for this purpose
      const allTokens = await prisma.emailVerificationToken.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      });
      console.log("Recent tokens in DB:", allTokens.length);
      if (allTokens.length > 0) {
        console.log(
          "Sample token from DB (first 20 chars):",
          allTokens[0].token.substring(0, 20)
        );
        console.log(
          "Incoming hashed token (first 20 chars):",
          hashedToken.substring(0, 20)
        );
      }
      // Check if token exists in DB at all (not hashed)
      const rawTokenCheck = await prisma.emailVerificationToken.findMany({
        where: { email: {} },
        take: 1,
      });
      if (rawTokenCheck.length > 0) {
        console.log(
          "Issue identified: Raw token hashing may not match. Compare above sample token with hashed token."
        );
      }
    }

    // Validate token
    if (!verificationToken) {
      console.log("❌ Token not found in database");
      return res.status(400).json({
        success: false,
        error: "Invalid verification link",
      });
    }

    if (verificationToken.used) {
      console.log("❌ Token already used");
      return res.status(400).json({
        success: false,
        error: "This link has already been used",
      });
    }

    if (verificationToken.expiresAt < new Date()) {
      console.log("❌ Token expired");
      // Clean up expired token
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return res.status(400).json({
        success: false,
        error: "This link has expired. Please request a new one.",
      });
    }

    // Delete token immediately (single-use, prevents replay attacks)
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
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
    const hashedSessionToken = hashToken(sessionToken);
    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        sessionToken: hashedSessionToken,
        expiresAt: getSessionExpiry(),
      },
    });

    // Generate JWT
    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

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
// GOOGLE OAUTH - Server-side flow (for Expo AuthSession)
// ============================================

/**
 * Step 1: Start Google OAuth
 * Redirects user to Google consent screen
 *
 * Query params:
 * - redirect: deep link to send JWT back to Expo app (e.g. googleoauthexoptus://auth?token=...)
 */
router.get("/google/start", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({
      success: false,
      error: "Google OAuth not configured (missing CLIENT_ID)",
    });
  }

  const redirectUri = `${
    process.env.SERVER_URL || "http://localhost:3000"
  }/auth/google/callback`;

  // Get the app redirect URI from Expo (where we'll send the JWT)
  const appRedirect = (req.query.redirect as string) || "";

  // Encode both in state so callback can access them
  const state = Buffer.from(
    JSON.stringify({ appRedirect, timestamp: Date.now() })
  ).toString("base64");

  console.log("🔐 Starting Google OAuth:");
  console.log(`📱 App redirect: ${appRedirect}`);
  console.log(`🌐 Callback: ${redirectUri}`);

  // Build Google OAuth URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("prompt", "select_account");

  console.log(
    `🔗 Redirecting to: ${googleAuthUrl.toString().substring(0, 80)}...`
  );
  res.redirect(googleAuthUrl.toString());
});

/**
 * Step 2: Google OAuth Callback
 * Exchanges auth code for tokens, verifies with jose, issues JWT
 *
 * Flow:
 * 1. Receive auth code from Google
 * 2. Exchange code for ID token using client secret
 * 3. Verify ID token using jose (CRITICAL for security)
 * 4. Create/link user account
 * 5. Issue Exoptus JWT
 * 6. Redirect back to Expo app with JWT in deep link
 */
router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    // Handle Google OAuth errors
    if (error) {
      console.error("❌ Google OAuth error:", error);
      return res.send(
        renderErrorPage("Authentication Failed", `Google error: ${error}`)
      );
    }

    if (!code || typeof code !== "string") {
      console.error("❌ No authorization code received");
      return res.send(
        renderErrorPage(
          "Invalid Request",
          "No authorization code received from Google"
        )
      );
    }

    // Parse state to get app deep link URL
    let appRedirect = "";
    try {
      const stateData = JSON.parse(
        Buffer.from(state as string, "base64").toString()
      );
      appRedirect = stateData.appRedirect || "";
    } catch (e) {
      console.error("Failed to parse state");
    }

    console.log("🔄 Processing Google OAuth callback");
    console.log(`📝 Code received: ${code.substring(0, 20)}...`);

    // Step 1: Exchange code for tokens
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
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("❌ Token exchange failed:", error);
      return res.send(
        renderErrorPage(
          "Token Exchange Failed",
          "Failed to exchange code for tokens"
        )
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      id_token?: string;
      access_token?: string;
      error?: string;
    };

    if (!tokenData.id_token) {
      console.error("❌ No ID token in response");
      return res.send(
        renderErrorPage("Missing ID Token", "Google did not return an ID token")
      );
    }

    console.log("✅ Token exchange successful");

    // Step 2: Verify ID token using jose (PRODUCTION SECURITY)
    // This ensures the token came from Google and hasn't been tampered with
    let googleUser: any;
    try {
      // Fetch Google's public keys
      const keyResponse = await fetch(
        "https://www.googleapis.com/oauth2/v1/certs"
      );
      const keys = (await keyResponse.json()) as Record<string, string>;

      // Find the kid (key id) in the token header
      const headerParts = tokenData.id_token.split(".");
      const header = JSON.parse(
        Buffer.from(headerParts[0], "base64").toString()
      );
      const kid = header.kid;

      if (!kid || !keys[kid]) {
        console.error("❌ Invalid token key ID");
        return res.send(
          renderErrorPage("Invalid Token", "Token key not found")
        );
      }

      // Import Google's public key
      const publicKey = await importSPKI(keys[kid], "RS256");

      // Verify the token signature and claims
      const verified = await jwtVerify(tokenData.id_token, publicKey, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: clientId!,
      });

      const payload = verified.payload as any;

      googleUser = {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };

      console.log(`✅ Token verified for: ${googleUser.email}`);
    } catch (verifyError: any) {
      console.error("❌ Token verification failed:", verifyError.message);
      return res.send(
        renderErrorPage(
          "Token Verification Failed",
          "Failed to verify Google ID token"
        )
      );
    }

    // Step 3: Find or create user
    const normalizedEmail = googleUser.email.toLowerCase().trim();

    let user: any;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (e) {
      // Fallback: try findFirst
      user = await prisma.user.findFirst({
        where: { email: normalizedEmail },
      });
    }

    if (!user) {
      console.log(`👤 Creating new user: ${normalizedEmail}`);
      // NEW USER - Create account
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
    } else if (!hasAuthProvider(user, "google")) {
      console.log(`🔗 Linking Google to existing user: ${normalizedEmail}`);
      // ACCOUNT LINKING
      user = await addAuthProvider(user.id, "google", {
        googleId: googleUser.googleId,
      });

      // Update profile
      const updates: any = { lastLoginAt: new Date() };
      if (!user.name && googleUser.name) updates.name = googleUser.name;
      if (!user.avatar && googleUser.picture)
        updates.avatar = googleUser.picture;

      user = await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
    } else {
      console.log(`✓ Returning user: ${normalizedEmail}`);
      // Returning user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
        },
      });
    }

    // Step 4: Create session and issue JWT
    const sessionToken = generateSecureToken();
    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt: getSessionExpiry(),
      },
    });

    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    console.log(`🎫 JWT issued for: ${user.email}`);

    // Step 5: Redirect back to Expo app with JWT
    if (appRedirect) {
      // Expo AuthSession expects callback to match the redirectUri
      const deepLink = `${appRedirect}?token=${encodeURIComponent(jwtToken)}`;
      console.log(`🔗 Redirecting to Expo: ${deepLink.substring(0, 80)}...`);
      return res.redirect(deepLink);
    }

    // Fallback: Show success page
    res.send(renderSuccessPage(user.email, user.name || "User", jwtToken));
  } catch (error: any) {
    console.error("❌ Google OAuth callback error:", error);
    res.send(
      renderErrorPage(
        "Sign In Failed",
        "An unexpected error occurred. Please try again."
      )
    );
  }
});

/**
 * Validate token endpoint
 * Called by Expo app to verify JWT is still valid
 */
router.get("/validate-token", async (req: Request, res: Response) => {
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

    // Verify session still exists
    const session = await prisma.authSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: "Session expired",
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Token validation error:", error);
    res.status(500).json({
      success: false,
      error: "Token validation failed",
    });
  }
});

// Helper: Render error page
function renderErrorPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Exoptus</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 100%);
          }
          .card {
            background: #1A1A2E;
            border-radius: 24px;
            padding: 48px 32px;
            text-align: center;
            max-width: 400px;
            margin: 20px;
            border: 1px solid rgba(139, 92, 246, 0.3);
          }
          .icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 32px;
          }
          h1 { color: #ffffff; margin: 0 0 12px; font-size: 24px; }
          p { color: rgba(255,255,255,0.7); margin: 0; font-size: 16px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">❌</div>
          <h1>${title}</h1>
          <p>${message}</p>
        </div>
      </body>
    </html>
  `;
}

// Helper: Render success page
function renderSuccessPage(email: string, name: string, token: string): string {
  return `
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
            background: linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 100%);
          }
          .card {
            background: #1A1A2E;
            border-radius: 24px;
            padding: 48px 32px;
            text-align: center;
            max-width: 400px;
            margin: 20px;
            border: 1px solid rgba(139, 92, 246, 0.3);
          }
          .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 40px;
          }
          h1 { color: #ffffff; margin: 0 0 12px; font-size: 24px; }
          p { color: rgba(255,255,255,0.7); margin: 0 0 8px; font-size: 16px; }
          .email {
            background: rgba(168, 85, 247, 0.2);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            color: #A855F7;
            margin: 16px 0 24px;
            display: inline-block;
          }
          .note {
            font-size: 14px;
            color: rgba(255,255,255,0.6);
            margin-top: 24px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>Welcome${name ? `, ${name}` : ""}!</h1>
          <p>You've successfully signed in</p>
          <div class="email">${email}</div>
          <div class="note">📱 If the app doesn't open automatically,<br/>please return to Exoptus</div>
        </div>
      </body>
    </html>
  `;
}

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

export default router;
