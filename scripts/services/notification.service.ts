/**
 * Notification Service
 * High-level interface for sending notifications to users
 */

import { PrismaClient } from "@prisma/client";
import { emailQueueService, SendEmailJobData } from "./email-queue.service";
import { EmailTemplateType, TemplateData } from "./email-templates.service";
import { logger } from "./logger.service";

const prisma = new PrismaClient();

class NotificationService {
  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    userId: string,
    userEmail: string,
    userName?: string
  ): Promise<void> {
    await this.sendNotification({
      userId,
      to: userEmail,
      templateType: "welcome",
      templateData: {
        userName: userName || "",
      },
    });
  }

  /**
   * Send verification success notification
   */
  async sendVerificationSuccess(
    userId: string,
    userEmail: string,
    data: {
      contentHash: string;
      manifestUri: string;
      creatorAddress: string;
    }
  ): Promise<void> {
    await this.sendNotification({
      userId,
      to: userEmail,
      templateType: "verification_success",
      templateData: data,
    });
  }

  /**
   * Send verification failure notification
   */
  async sendVerificationFailure(
    userId: string,
    userEmail: string,
    data: {
      contentHash: string;
      reason: string;
    }
  ): Promise<void> {
    await this.sendNotification({
      userId,
      to: userEmail,
      templateType: "verification_failure",
      templateData: data,
    });
  }

  /**
   * Send verification pending notification
   */
  async sendVerificationPending(
    userId: string,
    userEmail: string,
    data: {
      contentHash: string;
    }
  ): Promise<void> {
    await this.sendNotification({
      userId,
      to: userEmail,
      templateType: "verification_pending",
      templateData: data,
    });
  }

  /**
   * Send platform binding confirmation
   */
  async sendPlatformBinding(
    userId: string,
    userEmail: string,
    data: {
      platform: string;
      platformId: string;
      contentHash: string;
    }
  ): Promise<void> {
    await this.sendNotification({
      userId,
      to: userEmail,
      templateType: "platform_binding",
      templateData: data,
    });
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(
    userId: string,
    userEmail: string,
    data: {
      txHash: string;
      chainId: number;
      type: string;
      status: string;
    }
  ): Promise<void> {
    await this.sendNotification({
      userId,
      to: userEmail,
      templateType: "transaction_notification",
      templateData: data,
    });
  }

  /**
   * Send security alert for new login
   */
  async sendSecurityAlertLogin(
    userId: string,
    userEmail: string,
    data: {
      ipAddress?: string;
      location?: string;
      device?: string;
      timestamp: string;
    }
  ): Promise<void> {
    await this.sendNotification({
      userId,
      to: userEmail,
      templateType: "security_alert_login",
      templateData: data,
    });
  }

  /**
   * Send security alert for password change
   */
  async sendSecurityAlertPasswordChange(
    userId: string,
    userEmail: string,
    data: {
      timestamp: string;
    }
  ): Promise<void> {
    await this.sendNotification({
      userId,
      to: userEmail,
      templateType: "security_alert_password_change",
      templateData: data,
    });
  }

  /**
   * Internal method to send notification
   */
  private async sendNotification(data: {
    userId: string;
    to: string;
    templateType: EmailTemplateType;
    templateData: TemplateData;
  }): Promise<void> {
    try {
      // Check if user has email preferences and create default if none exist
      const prefs = await prisma.emailPreferences.findUnique({
        where: { userId: data.userId },
      });

      if (!prefs) {
        await prisma.emailPreferences.create({
          data: {
            userId: data.userId,
          },
        });
      }

      // Queue the email
      const jobData: SendEmailJobData = {
        userId: data.userId,
        to: data.to,
        templateType: data.templateType,
        templateData: data.templateData,
        metadata: {
          sentAt: new Date().toISOString(),
        },
      };

      await emailQueueService.queueEmail(jobData);

      logger.info("Notification queued", {
        userId: data.userId,
        templateType: data.templateType,
      });
    } catch (error) {
      logger.error("Failed to queue notification", {
        userId: data.userId,
        templateType: data.templateType,
        error,
      });
      // Don't throw - notifications should not block main operations
    }
  }

  /**
   * Update user email preferences
   */
  async updateEmailPreferences(
    userId: string,
    preferences: {
      welcomeEmails?: boolean;
      verificationUpdates?: boolean;
      platformBindingConfirmations?: boolean;
      transactionNotifications?: boolean;
      securityAlerts?: boolean;
      frequency?: "immediate" | "daily_digest";
    }
  ): Promise<void> {
    await prisma.emailPreferences.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences,
      },
    });

    logger.info("Email preferences updated", { userId });
  }

  /**
   * Unsubscribe user from all emails
   */
  async unsubscribe(userId: string): Promise<void> {
    await prisma.emailPreferences.upsert({
      where: { userId },
      update: {
        unsubscribedAt: new Date(),
      },
      create: {
        userId,
        unsubscribedAt: new Date(),
      },
    });

    logger.info("User unsubscribed from emails", { userId });
  }

  /**
   * Resubscribe user to emails
   */
  async resubscribe(userId: string): Promise<void> {
    await prisma.emailPreferences.update({
      where: { userId },
      data: {
        unsubscribedAt: null,
      },
    });

    logger.info("User resubscribed to emails", { userId });
  }

  /**
   * Get user email preferences
   */
  async getEmailPreferences(userId: string) {
    let prefs = await prisma.emailPreferences.findUnique({
      where: { userId },
    });

    // Create default preferences if none exist
    if (!prefs) {
      prefs = await prisma.emailPreferences.create({
        data: {
          userId,
        },
      });
    }

    return prefs;
  }

  /**
   * Get email delivery stats for a user
   */
  async getEmailStats(userId: string) {
    const logs = await prisma.emailLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const stats = {
      total: logs.length,
      sent: logs.filter((l) => l.status === "sent").length,
      delivered: logs.filter((l) => l.status === "delivered").length,
      failed: logs.filter((l) => l.status === "failed").length,
      bounced: logs.filter((l) => l.status === "bounced").length,
      recentEmails: logs.slice(0, 10).map((l) => ({
        subject: l.subject,
        status: l.status,
        sentAt: l.sentAt,
        templateType: l.templateType,
      })),
    };

    return stats;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
