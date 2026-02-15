import { Request, Response, NextFunction } from "express";

/**
 * Require API key for protected endpoints.
 *
 * Behavior:
 * - If API_KEY is set in env, requests must provide it via x-api-key or authorization header.
 * - If API_KEY is NOT set in env, the middleware allows requests through (open mode).
 *   Set REQUIRE_API_KEY=true to fail closed when API_KEY is missing.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.API_KEY;

  // Fail closed: if API_KEY is not configured and REQUIRE_API_KEY is set, reject
  if (!expected) {
    if (process.env.REQUIRE_API_KEY === "true" || process.env.NODE_ENV === "production") {
      res.status(503).json({ error: "Service misconfigured" });
      return;
    }
    // Development mode: allow through without API key (with warning)
    return next();
  }

  const provided = req.header("x-api-key") || req.header("authorization");
  if (provided === expected) return next();
  res.status(401).json({ error: "Unauthorized" });
}
