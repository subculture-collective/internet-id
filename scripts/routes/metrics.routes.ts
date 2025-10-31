import { Router } from "express";
import { metricsService } from "../services/metrics.service";

const router = Router();

/**
 * @route GET /api/metrics
 * @desc Get Prometheus metrics
 * @access Public (typically restricted by network/firewall in production)
 */
router.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    const metrics = await metricsService.getMetrics();
    res.send(metrics);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to retrieve metrics" });
  }
});

/**
 * @route GET /api/metrics/json
 * @desc Get metrics in JSON format
 * @access Public
 */
router.get("/metrics/json", async (req, res) => {
  try {
    const metrics = await metricsService.getMetricsJson();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to retrieve metrics" });
  }
});

export default router;
