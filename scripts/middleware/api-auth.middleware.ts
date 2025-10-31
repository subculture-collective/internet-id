import { Request, Response, NextFunction } from "express";
import { verifyApiKey } from "../services/api-key.service";
import { verifyJwtToken, extractTokenFromHeader } from "../services/jwt.service";

/**
 * Extended Request with authentication info
 */
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    tier: string;
    rateLimit: number;
    method: "apiKey" | "jwt";
  };
}

/**
 * Middleware to authenticate API requests using either API key or JWT token
 * Supports multiple authentication methods:
 * 1. x-api-key header with API key
 * 2. Authorization header with JWT token (Bearer token or raw)
 */
export function authenticateRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.header("x-api-key");
  const authHeader = req.header("authorization");

  // Try API key authentication first
  if (apiKey) {
    verifyApiKey(apiKey)
      .then((result) => {
        if (result) {
          req.auth = {
            userId: result.userId,
            tier: result.tier,
            rateLimit: result.rateLimit,
            method: "apiKey",
          };
          return next();
        }
        res.status(401).json({ error: "Invalid API key" });
      })
      .catch(() => {
        res.status(401).json({ error: "API key verification failed" });
      });
    return;
  }

  // Try JWT token authentication
  if (authHeader) {
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      const decoded = verifyJwtToken(token);
      if (decoded) {
        req.auth = {
          userId: decoded.userId,
          tier: decoded.tier || "free",
          rateLimit: decoded.tier === "paid" ? 1000 : 100,
          method: "jwt",
        };
        return next();
      }
    }
    res.status(401).json({ error: "Invalid or expired JWT token" });
    return;
  }

  // No authentication provided
  res.status(401).json({
    error: "Authentication required",
    hint: "Provide x-api-key header or Authorization header with Bearer token",
  });
}

/**
 * Optional authentication - doesn't fail if no auth provided
 * But populates req.auth if valid credentials are present
 */
export function optionalAuthentication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.header("x-api-key");
  const authHeader = req.header("authorization");

  // Try API key authentication
  if (apiKey) {
    verifyApiKey(apiKey)
      .then((result) => {
        if (result) {
          req.auth = {
            userId: result.userId,
            tier: result.tier,
            rateLimit: result.rateLimit,
            method: "apiKey",
          };
        }
        next();
      })
      .catch(() => next());
    return;
  }

  // Try JWT token authentication
  if (authHeader) {
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      const decoded = verifyJwtToken(token);
      if (decoded) {
        req.auth = {
          userId: decoded.userId,
          tier: decoded.tier || "free",
          rateLimit: decoded.tier === "paid" ? 1000 : 100,
          method: "jwt",
        };
      }
    }
  }

  next();
}
