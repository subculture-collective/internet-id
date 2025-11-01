import { Request, Response, NextFunction } from "express";
import { metricsService } from "../services/metrics.service";

/**
 * Express middleware to track HTTP request metrics
 */
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Capture response to record metrics
    const originalSend = res.send;
    res.send = function (data: any) {
      // Restore original send first to prevent recursion
      res.send = originalSend;

      const durationSeconds = (Date.now() - startTime) / 1000;
      const route = req.route?.path || req.path || "unknown";

      // Record HTTP request metrics
      metricsService.recordHttpRequest(req.method, route, res.statusCode, durationSeconds);

      return originalSend.call(this, data);
    };

    next();
  };
}
