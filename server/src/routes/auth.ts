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
// EMAIL MAGIC LINK - VERIFY (GET - direct link click)
// ============================================
router.get("/email/verify", async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res
      .status(400)
      .send(
        renderErrorPage("Invalid Link", "This verification link is invalid.")
      );
  }

  try {
    // Hash the incoming token to match stored hash
    const hashedToken = hashToken(token);

    // Find token in database using findFirst (more reliable than findUnique for unique constraints)
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!verificationToken) {
      return res
        .status(400)
        .send(
          renderErrorPage(
            "Invalid Link",
            "This verification link is invalid or has already been used."
          )
        );
    }

    if (verificationToken.used) {
      return res
        .status(400)
        .send(
          renderErrorPage(
            "Link Already Used",
            "This link has already been used. Please request a new one."
          )
        );
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return res
        .status(400)
        .send(
          renderErrorPage(
            "Link Expired",
            "This link has expired. Please request a new one."
          )
        );
    }

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

    // Generate JWT for authenticated session
    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    // Get redirect path based on onboarding status
    const redirectPath = getRedirectPath(user);

    // Redirect to mobile app with JWT (already verified via GET)
    // Use 'jwt' param to indicate this is an already-verified session token
    const expoDevUrl = process.env.EXPO_DEV_URL || "exp://localhost:8081";
    const appScheme = process.env.APP_SCHEME || "exoptus";

    // Build deep links with JWT and user data (already verified, no need for POST verification)
    const userData = encodeURIComponent(
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
    );

    const expoLink = `${expoDevUrl}/--/(auth)/verifying?jwt=${encodeURIComponent(
      jwtToken
    )}&redirectTo=${encodeURIComponent(redirectPath)}&user=${userData}`;
    const prodLink = `${appScheme}://(auth)/verifying?jwt=${encodeURIComponent(
      jwtToken
    )}&redirectTo=${encodeURIComponent(redirectPath)}&user=${userData}`;
    const devBuildLink = `exoptus://(auth)/verifying?jwt=${encodeURIComponent(
      jwtToken
    )}&redirectTo=${encodeURIComponent(redirectPath)}&user=${userData}`;

    // Auto-redirect to mobile app
    res.send(
      renderSuccessPage(
        user.email,
        user.name,
        jwtToken, // Pass JWT (already verified)
        expoLink,
        prodLink,
        devBuildLink
      )
    );
  } catch (error: any) {
    console.error("Email verify GET error:", error);
    return res
      .status(500)
      .send(
        renderErrorPage(
          "Verification Failed",
          "Something went wrong. Please try again."
        )
      );
  }
});

// Helper function to render error pages
function renderErrorPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Exoptus</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 100%); }
          .card { background: #1A1A2E; border-radius: 24px; padding: 48px 32px; text-align: center; max-width: 400px; margin: 20px; border: 1px solid rgba(139, 92, 246, 0.3); }
          .icon { width: 64px; height: 64px; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; }
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

// Helper function to render success page with deep links
function renderSuccessPage(
  email: string,
  name: string | null,
  token: string,
  expoLink: string,
  prodLink: string,
  devBuildLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified - Exoptus</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 100%); }
          .card { background: #1A1A2E; border-radius: 24px; padding: 48px 32px; text-align: center; max-width: 400px; margin: 20px; border: 1px solid rgba(139, 92, 246, 0.3); }
          .icon { width: 80px; height: 80px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 40px; }
          h1 { color: #ffffff; margin: 0 0 12px; font-size: 24px; }
          p { color: rgba(255,255,255,0.7); margin: 0 0 8px; font-size: 16px; }
          .email { background: rgba(168, 85, 247, 0.2); padding: 8px 16px; border-radius: 8px; font-size: 14px; color: #A855F7; margin: 16px 0 24px; display: inline-block; }
          .btn { display: block; background: linear-gradient(135deg, #A855F7 0%, #7C3AED 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 12px 0; transition: transform 0.2s; }
          .btn:hover { transform: translateY(-2px); }
          .btn-secondary { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); }
          .divider { margin: 20px 0; color: rgba(255,255,255,0.4); font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>Welcome${name ? `, ${name}` : ""}!</h1>
          <p>Your email has been verified</p>
          <div class="email">${email}</div>
          
          <a href="${expoLink}" class="btn">📱 Open in Expo Go</a>
          
          <div class="divider">— other options —</div>
          
          <a href="${devBuildLink}" class="btn btn-secondary">Open Dev Build</a>
          <a href="${prodLink}" class="btn btn-secondary">Open Production App</a>
        </div>
        
        <script>
          // Auto-redirect to Expo Go (for development)
          // Change to prodLink for production builds
          function redirectToApp() {
            // Try Expo Go first (development)
            window.location.href = "${expoLink}";
            
            // Fallback: try iframe method after 2s
            setTimeout(() => {
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              iframe.src = "${expoLink}";
              document.body.appendChild(iframe);
            }, 2000);
          }
          
          // Start redirect immediately
          redirectToApp();
          
          // Manual button clicks for other options
          document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              window.location.href = btn.getAttribute('href');
            });
          });
        </script>
      </body>
    </html>
  `;
}

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

  // Check if this is from expo-web-browser (expects direct redirect back)
  const isWebBrowser = req.query.webBrowser === "true";

  const state = Buffer.from(
    JSON.stringify({ appRedirect, isWebBrowser })
  ).toString("base64");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId!);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("prompt", "consent");

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

    // Parse state to get app redirect URL and browser type
    let appRedirect = "";
    let isWebBrowser = false;
    try {
      const stateData = JSON.parse(
        Buffer.from(state as string, "base64").toString()
      );
      appRedirect = stateData.appRedirect || "";
      isWebBrowser = stateData.isWebBrowser === true;
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
    let user: any;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (prismaErr) {
      // Fallback: try findFirst in case of schema/client mismatch
      try {
        user = await prisma.user.findFirst({
          where: { email: normalizedEmail },
        });
      } catch (fallbackErr) {
        throw prismaErr;
      }
    }

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
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || googleUser.name,
          avatar: user.avatar || googleUser.picture,
          lastLoginAt: new Date(),
        },
      });
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

    // Build deep link URLs
    const expoDevUrl = process.env.EXPO_DEV_URL || "exp://localhost:8081";
    const appScheme = process.env.APP_SCHEME || "exoptus";

    const expoLink = `${expoDevUrl}/--/google-callback?token=${jwtToken}&success=true`;
    const prodLink = `${appScheme}://google-callback?token=${jwtToken}&success=true`;

    // For expo-web-browser: Direct redirect back to app (no HTML page)
    // This allows openAuthSessionAsync to capture the callback automatically
    if (isWebBrowser) {
      return res.redirect(expoLink);
    }

    // For browser-based flow: Show success page with deep link button
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

export default router;
