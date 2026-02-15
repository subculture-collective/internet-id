import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

// Import routers
import healthRoutes from "./routes/health.routes";
import uploadRoutes from "./routes/upload.routes";
import manifestRoutes from "./routes/manifest.routes";
import registerRoutes from "./routes/register.routes";
import verifyRoutes from "./routes/verify.routes";
import verificationJobsRoutes from "./routes/verification-jobs.routes";
import bindingRoutes from "./routes/binding.routes";
import contentRoutes from "./routes/content.routes";
import oneshotRoutes from "./routes/oneshot.routes";
import badgeRoutes from "./routes/badge.routes";
import notificationsRoutes from "./routes/notifications.routes";

// Import v1 API routes
import v1Routes from "./routes/v1/index";

// Import rate limiting middleware
import {
  strictRateLimit,
  moderateRateLimit,
  relaxedRateLimit,
} from "./middleware/rate-limit.middleware";

// Import cache service
import { cacheService } from "./services/cache.service";

// Import swagger spec
import { swaggerSpec } from "./services/swagger.service";

// Import observability services
import { logger, requestLoggerMiddleware } from "./services/logger.service";
import { metricsService } from "./services/metrics.service";
import { metricsMiddleware } from "./middleware/metrics.middleware";
import metricsRoutes from "./routes/metrics.routes";
import { sentryService } from "./services/sentry.service";

export async function createApp() {
  // Initialize Sentry error tracking
  sentryService.initialize();

  // Initialize cache service
  await cacheService.connect();

  // Initialize email services
  const { emailService } = await import("./services/email.service");
  const { emailQueueService } = await import("./services/email-queue.service");
  await emailService.initialize();
  await emailQueueService.initialize();

  // Initialize verification queue service
  const { verificationQueueService } = await import("./services/verification-queue.service");
  await verificationQueueService.initialize();

  const app = express();

  // Sentry request handler (must be first middleware)
  app.use(sentryService.getRequestHandler());

  // Sentry tracing handler (for performance monitoring)
  app.use(sentryService.getTracingHandler());

  // Request logging middleware (before other middleware)
  app.use(requestLoggerMiddleware());

  // Metrics tracking middleware
  app.use(metricsMiddleware());

  // Track active connections
  app.use((req, res, next) => {
    metricsService.incrementConnections();
    res.on("finish", () => metricsService.decrementConnections());
    next();
  });

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  // Wait for rate limiters to initialize
  const strict = await strictRateLimit;
  const moderate = await moderateRateLimit;
  const relaxed = await relaxedRateLimit;

  logger.info("Rate limiters initialized");

  // Swagger documentation
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (req, res) => {
    res.json(swaggerSpec);
  });

  // Mount v1 API routes (versioned)
  app.use("/api/v1", moderate, v1Routes);

  // Mount metrics endpoint (no rate limiting for monitoring)
  app.use("/api", metricsRoutes);

  // Mount legacy routers with appropriate rate limits
  // Relaxed limits for health/status checks
  app.use("/api", relaxed, healthRoutes);

  // Moderate limits for read endpoints
  app.use("/api", moderate, contentRoutes);
  app.use("/api", moderate, verifyRoutes);
  app.use("/api/verification-jobs", moderate, verificationJobsRoutes);
  app.use("/api", moderate, badgeRoutes);
  app.use("/api/notifications", moderate, notificationsRoutes);

  // Strict limits for expensive operations
  app.use("/api", strict, uploadRoutes);
  app.use("/api", strict, manifestRoutes);
  app.use("/api", strict, registerRoutes);
  app.use("/api", strict, bindingRoutes);
  app.use("/api", strict, oneshotRoutes);

  logger.info("Application routes configured");

  // Sentry error handler (must be after all routes)
  app.use(sentryService.getErrorHandler());

  // Global error handler
  app.use(
    (
      err: Error & { status?: number },
      req: express.Request & { correlationId?: string },
      res: express.Response,
      _next: express.NextFunction
    ) => {
      logger.error("Unhandled error", err, {
        method: req.method,
        path: req.path,
        correlationId: req.correlationId,
      });

      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
        correlationId: req.correlationId,
      });
    }
  );

  return app;
}
