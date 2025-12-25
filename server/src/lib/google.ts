/**
 * Google OAuth Verification
 */

import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

/**
 * Verify Google ID token and extract user info
 */
export async function verifyGoogleToken(
  idToken: string
): Promise<GoogleUserInfo | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      picture: payload.picture,
      googleId: payload.sub,
    };
  } catch (error) {
    console.error("Google token verification failed:", error);
    return null;
  }
}
