import { Router, Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import { emailQueueService } from "../services/email-queue.service";
import { prisma } from "../db";

const router = Router();

/**
 * Get user's email preferences
 * GET /api/notifications/preferences
 */
router.get("/preferences", async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { userId?: string }).userId; // Assumes auth middleware sets this
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const preferences = await notificationService.getEmailPreferences(userId);
    res.json(preferences);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch preferences";
    console.error("[Notifications] Error fetching preferences:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Update user's email preferences
 * PUT /api/notifications/preferences
 */
router.put("/preferences", async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const {
      welcomeEmails,
      verificationUpdates,
      platformBindingConfirmations,
      transactionNotifications,
      securityAlerts,
      frequency,
    } = req.body;

    await notificationService.updateEmailPreferences(userId, {
      welcomeEmails,
      verificationUpdates,
      platformBindingConfirmations,
      transactionNotifications,
      securityAlerts,
      frequency,
    });

    res.json({ success: true, message: "Preferences updated successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update preferences";
    console.error("[Notifications] Error updating preferences:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Unsubscribe from all emails
 * POST /api/notifications/unsubscribe
 */
router.post("/unsubscribe", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // TODO: SECURITY - Implement token verification before production deployment
    // to prevent unauthorized unsubscribes. This endpoint currently allows any
    // user to unsubscribe other users by providing their userId.
    await notificationService.unsubscribe(userId);

    res.json({ success: true, message: "Successfully unsubscribed from all emails" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to unsubscribe";
    console.error("[Notifications] Error unsubscribing:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Resubscribe to emails
 * POST /api/notifications/resubscribe
 */
router.post("/resubscribe", async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    await notificationService.resubscribe(userId);

    res.json({ success: true, message: "Successfully resubscribed to emails" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to resubscribe";
    console.error("[Notifications] Error resubscribing:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Get email delivery statistics
 * GET /api/notifications/stats
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const stats = await notificationService.getEmailStats(userId);
    res.json(stats);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch stats";
    console.error("[Notifications] Error fetching stats:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Get email queue statistics (admin only)
 * GET /api/notifications/queue/stats
 */
router.get("/queue/stats", async (_req: Request, res: Response) => {
  try {
    // TODO: SECURITY - Add admin authorization middleware before production deployment
    // This endpoint exposes sensitive operational data and should be restricted
    // to authenticated administrators only.
    const stats = await emailQueueService.getStats();
    res.json(stats);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch queue stats";
    console.error("[Notifications] Error fetching queue stats:", error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Get recent email logs for a user
 * GET /api/notifications/logs
 */
router.get("/logs", async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    
    const logs = await prisma.emailLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      select: {
        id: true,
        recipient: true,
        subject: true,
        templateType: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        error: true,
        createdAt: true,
      },
    });

    res.json({ logs });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch logs";
    console.error("[Notifications] Error fetching logs:", error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
