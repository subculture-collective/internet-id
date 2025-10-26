import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";
import type { Request, Response } from "express";

// Redis client setup (optional)
let redisClient: ReturnType<typeof createClient> | null = null;

async function initRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log("REDIS_URL not configured, using in-memory rate limiting");
    return null;
  }

  try {
    redisClient = createClient({ url: redisUrl });
    redisClient.on("error", (err) => {
      console.warn("Redis client error:", err);
      redisClient = null;
    });
    await redisClient.connect();
    console.log("Redis client connected for rate limiting");
    return redisClient;
  } catch (error) {
    console.warn("Failed to connect to Redis, falling back to in-memory:", error);
    return null;
  }
}

// Rate limit handler that returns 429 with Retry-After header
const rateLimitHandler = (req: Request, res: Response) => {
  const retryAfter = Math.ceil(
    req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60
  );

  res.setHeader("Retry-After", retryAfter);
  res.status(429).json({
    error: "Too Many Requests",
    message: "Rate limit exceeded. Please try again later.",
    retryAfter,
  });
};

// Skip rate limiting based on conditions
const skipRateLimit = (req: Request): boolean => {
  // Skip rate limiting for authenticated users with API key (if configured to do so)
  const exemptApiKey = process.env.RATE_LIMIT_EXEMPT_API_KEY;
  if (exemptApiKey) {
    const providedKey = req.header("x-api-key") || req.header("authorization");
    if (providedKey === exemptApiKey) {
      return true;
    }
  }

  return false;
};

// Log rate limit hits for monitoring
const onLimitReached = (req: Request, _res: Response) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const path = req.path;
  console.warn(`[RATE_LIMIT_HIT] IP: ${ip}, Path: ${path}, Time: ${new Date().toISOString()}`);
};

/**
 * Create a rate limiter with the specified configuration
 */
async function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const client = await initRedisClient();

  interface RateLimitConfig {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
    handler: typeof rateLimitHandler;
    skip: typeof skipRateLimit;
    onLimitReached: typeof onLimitReached;
    store?: RedisStore;
  }

  const config: RateLimitConfig = {
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || "Too many requests, please try again later.",
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    handler: rateLimitHandler,
    skip: skipRateLimit,
    onLimitReached,
  };

  // Use Redis store if available, otherwise fall back to in-memory
  if (client) {
    config.store = new RedisStore({
      // @ts-expect-error - RedisStore types are slightly incompatible
      sendCommand: (...args: string[]) => client.sendCommand(args),
      prefix: "rl:",
    });
  }

  return rateLimit(config);
}

// Strict rate limiter for expensive operations (upload, on-chain transactions)
// 10 requests per minute
export const strictRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: "Rate limit exceeded for expensive operations. Maximum 10 requests per minute.",
});

// Moderate rate limiter for read endpoints
// 100 requests per minute
export const moderateRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: "Rate limit exceeded for read operations. Maximum 100 requests per minute.",
});

// Relaxed rate limiter for health/status checks
// 1000 requests per minute (effectively unlimited for normal usage)
export const relaxedRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: "Rate limit exceeded. Maximum 1000 requests per minute.",
});

// Export for testing
export { initRedisClient, rateLimitHandler, skipRateLimit, onLimitReached };
