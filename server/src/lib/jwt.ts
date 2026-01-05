/**
 * JWT Token Utilities
 *
 * Production-ready token generation and verification
 * with secure hashing for magic link tokens.
 */

import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  sessionId: string;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Generate cryptographically secure random token for magic links
 * Uses crypto.randomBytes for better security than UUID
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a token using SHA-256 for secure database storage
 * The raw token is sent to user, only hash is stored
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Get token expiry date (15 minutes for magic links)
 */
export function getMagicLinkExpiry(): Date {
  return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
}

/**
 * Get session expiry date (7 days)
 */
export function getSessionExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
}
