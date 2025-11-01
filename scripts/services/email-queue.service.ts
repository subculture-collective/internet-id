/**
 * Email Queue Service
 * Handles async email job processing using BullMQ and Redis
 */

import { Queue, Worker, Job, QueueEvents } from "bullmq";
import { Redis } from "ioredis";
import { logger } from "./logger.service";
import { emailService, EmailOptions } from "./email.service";
import {
  emailTemplateService,
  EmailTemplateType,
  TemplateData,
} from "./email-templates.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Job data types
interface SendEmailJobData {
  to: string;
  templateType: EmailTemplateType;
  templateData: TemplateData;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface DirectEmailJobData extends EmailOptions {
  userId?: string;
  templateType?: string;
  metadata?: Record<string, unknown>;
}

type EmailJobData = SendEmailJobData | DirectEmailJobData;

// Queue configuration
const QUEUE_NAME = "email";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF = {
  type: "exponential" as const,
  delay: 5000, // Start with 5 seconds
};

class EmailQueueService {
  private queue?: Queue<EmailJobData>;
  private worker?: Worker<EmailJobData>;
  private queueEvents?: QueueEvents;
  private connection?: Redis;
  private isInitialized = false;

  /**
   * Initialize the email queue
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.info(
        "Email queue disabled (REDIS_URL not set). Emails will be sent synchronously."
      );
      this.isInitialized = true;
      return;
    }

    try {
      // Create Redis connection
      this.connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
      });

      // Create queue
      this.queue = new Queue<EmailJobData>(QUEUE_NAME, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: MAX_RETRY_ATTEMPTS,
          backoff: RETRY_BACKOFF,
          removeOnComplete: {
            age: 3600 * 24 * 7, // Keep completed jobs for 7 days
            count: 1000,
          },
          removeOnFail: {
            age: 3600 * 24 * 30, // Keep failed jobs for 30 days
          },
        },
      });

      // Create worker to process jobs
      this.worker = new Worker<EmailJobData>(
        QUEUE_NAME,
        async (job: Job<EmailJobData>) => {
          return await this.processEmailJob(job);
        },
        {
          connection: this.connection,
          concurrency: 5, // Process up to 5 emails concurrently
        }
      );

      // Create queue events listener
      this.queueEvents = new QueueEvents(QUEUE_NAME, {
        connection: this.connection,
      });

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      logger.info("Email queue service initialized with Redis");
    } catch (error) {
      logger.error("Failed to initialize email queue:", error);
      throw error;
    }
  }

  /**
   * Set up event listeners for queue monitoring
   */
  private setupEventListeners(): void {
    if (!this.worker || !this.queueEvents) return;

    this.worker.on("completed", (job) => {
      logger.info("Email job completed", {
        jobId: job.id,
        attempts: job.attemptsMade,
      });
    });

    this.worker.on("failed", (job, error) => {
      logger.error("Email job failed", {
        jobId: job?.id,
        attempts: job?.attemptsMade,
        error: error.message,
      });
    });

    this.queueEvents.on("stalled", ({ jobId }) => {
      logger.warn("Email job stalled", { jobId });
    });
  }

  /**
   * Process an email job
   */
  private async processEmailJob(
    job: Job<EmailJobData>
  ): Promise<{ success: boolean; messageId?: string }> {
    const data = job.data;
    let emailOptions: EmailOptions;
    let templateType: string | undefined;
    let userId: string | undefined;

    // Log email to database
    const emailLog = await prisma.emailLog.create({
      data: {
        userId: data.userId,
        recipient: data.to,
        subject: "",
        templateType: "",
        status: "queued",
        retryCount: job.attemptsMade,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    try {
      // Check if this is a template-based email or direct email
      if ("templateType" in data && "templateData" in data) {
        // Template-based email
        const template = emailTemplateService.getTemplate(
          data.templateType,
          data.templateData
        );
        emailOptions = {
          to: data.to,
          subject: template.subject,
          html: template.html,
          text: template.text,
        };
        templateType = data.templateType;
        userId = data.userId;
      } else {
        // Direct email with all options provided
        emailOptions = {
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
          from: data.from,
          replyTo: data.replyTo,
          attachments: data.attachments,
        };
        templateType = data.templateType;
        userId = data.userId;
      }

      // Check user preferences before sending
      if (userId && templateType) {
        const shouldSend = await this.checkUserPreferences(userId, templateType);
        if (!shouldSend) {
          logger.info("Email not sent due to user preferences", {
            userId,
            templateType,
          });

          await prisma.emailLog.update({
            where: { id: emailLog.id },
            data: {
              status: "skipped",
              subject: emailOptions.subject,
              templateType: templateType || "direct",
            },
          });

          return { success: true, messageId: "skipped" };
        }
      }

      // Send the email
      const result = await emailService.sendEmail(emailOptions);

      // Update email log
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          subject: emailOptions.subject,
          templateType: templateType || "direct",
          status: result.success ? "sent" : "failed",
          providerId: result.messageId,
          error: result.error,
          sentAt: result.success ? new Date() : null,
          retryCount: job.attemptsMade,
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      return { success: true, messageId: result.messageId };
    } catch (error) {
      // Update email log with error
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          retryCount: job.attemptsMade,
        },
      });

      throw error;
    }
  }

  /**
   * Check if email should be sent based on user preferences
   */
  private async checkUserPreferences(
    userId: string,
    templateType: string
  ): Promise<boolean> {
    try {
      const prefs = await prisma.emailPreferences.findUnique({
        where: { userId },
      });

      // If no preferences found, default to sending
      if (!prefs) return true;

      // Check if user has unsubscribed
      if (prefs.unsubscribedAt) return false;

      // Check specific notification type preferences
      const typeMap: Record<string, keyof typeof prefs> = {
        welcome: "welcomeEmails",
        verification_success: "verificationUpdates",
        verification_failure: "verificationUpdates",
        verification_pending: "verificationUpdates",
        platform_binding: "platformBindingConfirmations",
        transaction_notification: "transactionNotifications",
        security_alert_login: "securityAlerts",
        security_alert_password_change: "securityAlerts",
      };

      const prefKey = typeMap[templateType];
      if (prefKey && typeof prefs[prefKey] === "boolean") {
        return prefs[prefKey] as boolean;
      }

      return true;
    } catch (error) {
      logger.error("Error checking user preferences", { userId, error });
      // Default to sending on error
      return true;
    }
  }

  /**
   * Queue an email to be sent
   */
  async queueEmail(data: SendEmailJobData): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // If queue is not available, send email synchronously
    if (!this.queue) {
      logger.debug("Sending email synchronously (queue not available)");
      const template = emailTemplateService.getTemplate(
        data.templateType,
        data.templateData
      );

      const result = await emailService.sendEmail({
        to: data.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      // Log to database
      await prisma.emailLog.create({
        data: {
          userId: data.userId,
          recipient: data.to,
          subject: template.subject,
          templateType: data.templateType,
          status: result.success ? "sent" : "failed",
          providerId: result.messageId,
          error: result.error,
          sentAt: result.success ? new Date() : null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });

      return result.messageId || null;
    }

    // Queue the email
    const job = await this.queue.add("send-email", data, {
      priority: this.getPriority(data.templateType),
    });

    logger.debug("Email queued", {
      jobId: job.id,
      to: data.to,
      templateType: data.templateType,
    });

    return job.id || null;
  }

  /**
   * Get priority for email based on type
   */
  private getPriority(templateType: EmailTemplateType): number {
    // Higher priority for security alerts
    if (
      templateType === "security_alert_login" ||
      templateType === "security_alert_password_change"
    ) {
      return 1;
    }

    // Medium priority for verification and transaction notifications
    if (
      templateType.startsWith("verification_") ||
      templateType === "transaction_notification"
    ) {
      return 5;
    }

    // Lower priority for welcome and binding confirmations
    return 10;
  }

  /**
   * Get queue stats
   */
  async getStats() {
    if (!this.queue) {
      return {
        available: false,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      };
    }

    const counts = await this.queue.getJobCounts();
    return {
      available: true,
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
    };
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queueEvents) {
      await this.queueEvents.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
    if (this.connection) {
      await this.connection.quit();
    }
    this.isInitialized = false;
  }

  /**
   * Check if queue is available
   */
  isAvailable(): boolean {
    return this.queue !== undefined;
  }
}

// Export singleton instance
export const emailQueueService = new EmailQueueService();

// Export types
export type { SendEmailJobData, DirectEmailJobData, EmailJobData };
