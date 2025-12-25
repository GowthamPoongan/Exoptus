/**
 * Email Service
 * Sends magic link verification emails
 */

import nodemailer from "nodemailer";

// Create transporter with proper Gmail settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Allow self-signed certificates
    rejectUnauthorized: false,
  },
});

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string
): Promise<boolean> {
  // For production: use custom scheme with proper route
  const appUrl = process.env.APP_URL || "exoptus://";
  const prodLink = `${appUrl}(auth)/verifying?token=${token}`;

  // For development build: use custom scheme (not exp://)
  const devBuildLink = `exoptus://(auth)/verifying?token=${token}`;

  // For Expo Go development: use exp:// scheme with proper route
  const expoDevUrl = process.env.EXPO_DEV_URL || "exp://10.175.216.47:8081";
  const expoGoLink = `${expoDevUrl}/--(auth)/verifying?token=${token}`;

  // Web redirect for testing
  const apiUrl = process.env.API_URL || "http://10.175.216.47:3000";
  const webLink = `${apiUrl}/auth/verify-redirect?token=${token}`;

  // Choose the appropriate link based on environment
  // Use dev build link for development (exoptus://)
  const magicLink =
    process.env.NODE_ENV === "production" ? prodLink : devBuildLink;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "Exoptus <noreply@exoptus.com>",
    to: email,
    subject: "Sign in to Exoptus",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in to Exoptus</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0066FF 0%, #3B82F6 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Exoptus</h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">where education meets direction</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 22px; font-weight: 600;">Sign in to your account</h2>
                    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                      Click the button below to securely sign in to Exoptus. This link will expire in 15 minutes.
                    </p>
                    
                    <!-- Button - Use web link which redirects to app (more reliable) -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 8px 0;">
                          <a href="${webLink}" style="display: inline-block; background: linear-gradient(135deg, #0066FF 0%, #3B82F6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 48px; border-radius: 12px;">
                            Sign in to Exoptus
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 14px; text-align: center;">
                      If the button doesn't work, copy this link:<br>
                      <a href="${webLink}" style="color: #0066FF; word-break: break-all;">${webLink}</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 30px; background-color: #f9fafb; text-align: center;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Sign in to Exoptus\n\nClick this link to sign in: ${magicLink}\n\nThis link expires in 15 minutes.`,
  };

  try {
    // Always log the magic link for debugging
    console.log("\n📧 Magic Link Email:");
    console.log(`   To: ${email}`);
    console.log(`   � Dev Build Link: ${devBuildLink}`);
    console.log(`   🌐 Web Link: ${webLink}`);
    console.log(`   🔵 Expo Go Link: ${expoGoLink}`);
    console.log(`   🚀 Production Link: ${prodLink}\n`);

    // Try to send the actual email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully!\n");
    } else {
      console.log(
        "⚠️  SMTP not configured - email not sent (use links above for testing)\n"
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    // Still return true so the flow continues - link is in console
    return true;
  }
}
