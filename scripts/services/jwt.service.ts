import jwt from "jsonwebtoken";

// Validate JWT_SECRET is set in production
const isProduction = process.env.NODE_ENV === "production";
if (!process.env.JWT_SECRET && isProduction) {
  throw new Error(
    "JWT_SECRET environment variable is required in production. " +
      "Generate a strong secret with: openssl rand -base64 32"
  );
}

const JWT_SECRET = process.env.JWT_SECRET || "development-only-secret-change-me";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "24h";

export interface JwtPayload {
  userId: string;
  address?: string;
  email?: string;
  tier?: string;
}

/**
 * Generate a JWT token for user-scoped API access
 */
export function generateJwtToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: "internet-id-api",
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyJwtToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "internet-id-api",
    }) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * Supports both "Bearer <token>" and raw token
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return authHeader;
}
