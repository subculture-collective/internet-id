import express from "express";
import cors from "cors";

// Import routers
import healthRoutes from "./routes/health.routes";
import uploadRoutes from "./routes/upload.routes";
import manifestRoutes from "./routes/manifest.routes";
import registerRoutes from "./routes/register.routes";
import verifyRoutes from "./routes/verify.routes";
import bindingRoutes from "./routes/binding.routes";
import contentRoutes from "./routes/content.routes";
import oneshotRoutes from "./routes/oneshot.routes";

// Import rate limiting middleware
import {
  strictRateLimit,
  moderateRateLimit,
  relaxedRateLimit,
} from "./middleware/rate-limit.middleware";

export async function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // Wait for rate limiters to initialize
  const strict = await strictRateLimit;
  const moderate = await moderateRateLimit;
  const relaxed = await relaxedRateLimit;

  // Mount routers with appropriate rate limits
  // Relaxed limits for health/status checks
  app.use("/api", relaxed, healthRoutes);

  // Moderate limits for read endpoints
  app.use("/api", moderate, contentRoutes);
  app.use("/api", moderate, verifyRoutes);

  // Strict limits for expensive operations
  app.use("/api", strict, uploadRoutes);
  app.use("/api", strict, manifestRoutes);
  app.use("/api", strict, registerRoutes);
  app.use("/api", strict, bindingRoutes);
  app.use("/api", strict, oneshotRoutes);

  return app;
}
