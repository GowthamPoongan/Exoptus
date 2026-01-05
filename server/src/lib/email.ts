/**
 * Email Service - SMTP with Nodemailer
 *
 * Sends magic link verification emails using SMTP.
 * Works with any SMTP provider (Gmail, Outlook, custom servers).
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Email configuration from environment
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Exoptus <noreply@exoptus.com>";
const APP_BASE_URL =
  process.env.APP_BASE_URL || process.env.SERVER_URL || "http://localhost:3000";

// Create reusable transporter
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        // Allow self-signed certificates (for institutional/college servers)
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

/**
 * Send magic link email via Resend
 *
 * @param email - Recipient email address
 * @param token - Magic link token (unhashed)
 * @param source - Optional source identifier for redirect handling
 * @returns Promise<boolean> - true if email sent successfully
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  source?: string
): Promise<boolean> {
  // Use HTTP link that backend will handle and redirect to app
  // Email clients block custom schemes like exoptus://, so we use HTTP
  // Backend will detect mobile and redirect to exoptus:// deep link
  const magicLink = `${APP_BASE_URL}/auth/email/verify?token=${encodeURIComponent(
    token
  )}`;

  // Google-style clean email template
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Sign in to Exoptus</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  
  <!-- Email Container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center" style="padding: 0 20px;">
        
        <!-- Main Content Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15); overflow: hidden;">
          
          <!-- Logo Section -->
          <tr>
            <td style="padding: 40px 40px 32px 40px; text-align: center; border-bottom: 1px solid #e8eaed;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, #A855F7 0%, #7C3AED 100%); border-radius: 12px; display: inline-block; text-align: center; line-height: 56px;">
                      <span style="font-size: 28px; font-weight: 700; color: #ffffff; vertical-align: middle;">E</span>
                    </div>
                    <!-- Company Name -->
                    <h1 style="margin: 0; font-size: 24px; font-weight: 500; color: #202124; letter-spacing: -0.3px;">Exoptus</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Message -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 400; color: #202124; line-height: 1.4;">
                Sign in to Exoptus
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #5f6368; line-height: 1.6;">
                Tap the button below to sign in to your account. This link will work for the next <strong style="color: #202124;">15 minutes</strong> and can only be used once.
              </p>
              
              <!-- Primary CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="left">
                    <a href="${magicLink}" 
                       target="_blank"
                       style="display: inline-block; 
                              background-color: #A855F7; 
                              color: #ffffff; 
                              text-decoration: none; 
                              font-size: 14px; 
                              font-weight: 500; 
                              padding: 12px 24px; 
                              border-radius: 4px;
                              line-height: 1.5;
                              mso-padding-alt: 0;
                              text-align: center;">
                      <!--[if mso]>
                      <i style="letter-spacing: 25px; mso-font-width: -100%; mso-text-raise: 30pt;">&nbsp;</i>
                      <![endif]-->
                      <span style="mso-text-raise: 15pt;">Sign in to Exoptus →</span>
                      <!--[if mso]>
                      <i style="letter-spacing: 25px; mso-font-width: -100%;">&nbsp;</i>
                      <![endif]-->
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 14px; color: #5f6368; line-height: 1.6;">
                If you didn't request this email, you can safely ignore it. Someone may have typed your email address by mistake.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="border-top: 1px solid #e8eaed;"></div>
            </td>
          </tr>
          
          <!-- Alternative Link Section -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #5f6368; line-height: 1.5;">
                <strong style="color: #202124;">Button not working?</strong> Copy and paste this link into your mobile browser:
              </p>
              <p style="margin: 0; padding: 12px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e8eaed; word-break: break-all;">
                <a href="${magicLink}" 
                   target="_blank"
                   style="color: #1a73e8; text-decoration: none; font-size: 12px; font-family: 'Courier New', Courier, monospace;">${magicLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f8f9fa; border-top: 1px solid #e8eaed;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #5f6368; line-height: 1.5;">
                      This email was sent to <strong style="color: #202124;">${email}</strong> because you requested a sign-in link for Exoptus.
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #80868b; line-height: 1.5;">
                      © 2026 Exoptus. Where education meets direction.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Outside Footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin-top: 16px;">
          <tr>
            <td style="padding: 0 20px;">
              <p style="margin: 0; font-size: 11px; color: #80868b; line-height: 1.5; text-align: center;">
                This email is intended for ${email}. If you're not expecting this email, you can ignore it.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `.trim();

  // Plain text fallback
  const textContent = `
EXOPTUS

Sign in to Exoptus
-------------------

Tap the link below to sign in to your account:

${magicLink}

This link will work for the next 15 minutes and can only be used once.

If you didn't request this email, you can safely ignore it. Someone may have typed your email address by mistake.

---
This email was sent to ${email} because you requested a sign-in link for Exoptus.

© 2026 Exoptus. Where education meets direction.
  `.trim();

  try {
    // Validate SMTP configuration
    if (!SMTP_USER || !SMTP_PASS) {
      console.error(
        "❌ SMTP credentials not configured (SMTP_USER, SMTP_PASS)"
      );
      throw new Error("Email service not configured");
    }

    // Send email via SMTP
    const info = await getTransporter().sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: "Sign in to Exoptus",
      html: htmlContent,
      text: textContent,
    });

    console.log(`✅ Magic link email sent to ${email} (ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error("❌ Email sending failed:", error.message);
    return false;
  }
}

/**
 * Verify email throttling (prevent spam)
 * Returns true if the email can receive a new magic link
 */
export async function canSendMagicLink(
  email: string,
  prisma: any
): Promise<{ allowed: boolean; waitSeconds?: number }> {
  // Check for recent tokens (within last 60 seconds)
  const recentToken = await prisma.emailVerificationToken.findFirst({
    where: {
      email: email.toLowerCase(),
      createdAt: {
        gte: new Date(Date.now() - 60 * 1000), // Last 60 seconds
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (recentToken) {
    const waitMs = 60 * 1000 - (Date.now() - recentToken.createdAt.getTime());
    return {
      allowed: false,
      waitSeconds: Math.ceil(waitMs / 1000),
    };
  }

  return { allowed: true };
}
