/**
 * Email Service
 * Handles sending emails through various providers (SendGrid, Postmark, AWS SES, SMTP)
 */

import nodemailer from "nodemailer";
import { logger } from "./logger.service";
import sgMail from "@sendgrid/mail";

// Email provider types
type EmailProvider = "sendgrid" | "postmark" | "ses" | "smtp" | "disabled";

// Email options
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

// Email service configuration
interface EmailConfig {
  provider: EmailProvider;
  from: string;
  fromName: string;
  replyTo?: string;
  baseUrl: string;
}

class EmailService {
  private config: EmailConfig;
  private transporter?: nodemailer.Transporter;
  private isInitialized = false;

  constructor() {
    this.config = {
      provider: (process.env.EMAIL_PROVIDER as EmailProvider) || "disabled",
      from: process.env.EMAIL_FROM || "noreply@internet-id.com",
      fromName: process.env.EMAIL_FROM_NAME || "Internet ID",
      replyTo: process.env.EMAIL_REPLY_TO,
      baseUrl:
        process.env.EMAIL_BASE_URL ||
        process.env.NEXT_PUBLIC_SITE_BASE ||
        "http://localhost:3000",
    };
  }

  /**
   * Initialize the email service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const { provider } = this.config;

    if (provider === "disabled") {
      logger.info("Email service is disabled (EMAIL_PROVIDER not set)");
      this.isInitialized = true;
      return;
    }

    try {
      switch (provider) {
        case "sendgrid":
          await this.initializeSendGrid();
          break;
        case "postmark":
          await this.initializePostmark();
          break;
        case "ses":
          await this.initializeSES();
          break;
        case "smtp":
          await this.initializeSMTP();
          break;
        default:
          throw new Error(`Unknown email provider: ${provider}`);
      }

      this.isInitialized = true;
      logger.info(`Email service initialized with provider: ${provider}`);
    } catch (error) {
      logger.error("Failed to initialize email service:", error);
      throw error;
    }
  }

  /**
   * Initialize SendGrid
   */
  private async initializeSendGrid(): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY is required for SendGrid provider");
    }
    sgMail.setApiKey(apiKey);
  }

  /**
   * Initialize Postmark (using nodemailer)
   */
  private async initializePostmark(): Promise<void> {
    const serverToken = process.env.POSTMARK_SERVER_TOKEN;
    if (!serverToken) {
      throw new Error(
        "POSTMARK_SERVER_TOKEN is required for Postmark provider"
      );
    }

    this.transporter = nodemailer.createTransport({
      host: "smtp.postmarkapp.com",
      port: 587,
      secure: false,
      auth: {
        user: serverToken,
        pass: serverToken,
      },
    });

    await this.transporter.verify();
  }

  /**
   * Initialize AWS SES
   */
  private async initializeSES(): Promise<void> {
    const region = process.env.AWS_SES_REGION;
    const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "AWS_SES_REGION, AWS_SES_ACCESS_KEY_ID, and AWS_SES_SECRET_ACCESS_KEY are required for SES provider"
      );
    }

    // Use nodemailer with SES transport
    // @ts-ignore - nodemailer-ses-transport types may not be available
    const aws = await import("@aws-sdk/client-ses");
    const sesClient = new aws.SES({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.transporter = nodemailer.createTransport({
      SES: { ses: sesClient, aws },
    });
  }

  /**
   * Initialize SMTP
   */
  private async initializeSMTP(): Promise<void> {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host) {
      throw new Error("SMTP_HOST is required for SMTP provider");
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    await this.transporter.verify();
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.config.provider === "disabled") {
      logger.debug("Email not sent (provider disabled):", {
        to: options.to,
        subject: options.subject,
      });
      return { success: true, messageId: "disabled" };
    }

    const from = options.from || `${this.config.fromName} <${this.config.from}>`;
    const replyTo = options.replyTo || this.config.replyTo;

    try {
      let messageId: string | undefined;

      if (this.config.provider === "sendgrid") {
        const msg = {
          to: options.to,
          from,
          replyTo,
          subject: options.subject,
          html: options.html,
          text: options.text,
          attachments: options.attachments?.map((att) => ({
            filename: att.filename,
            content: att.content.toString("base64"),
            type: att.contentType,
            disposition: "attachment",
          })),
        };

        const result = await sgMail.send(msg);
        messageId = result[0]?.headers?.["x-message-id"] || undefined;
      } else if (this.transporter) {
        const info = await this.transporter.sendMail({
          from,
          to: options.to,
          replyTo,
          subject: options.subject,
          html: options.html,
          text: options.text,
          attachments: options.attachments,
        });

        messageId = info.messageId;
      } else {
        throw new Error("Email transporter not initialized");
      }

      logger.info("Email sent successfully", {
        provider: this.config.provider,
        to: options.to,
        subject: options.subject,
        messageId,
      });

      return { success: true, messageId };
    } catch (error) {
      logger.error("Failed to send email", {
        provider: this.config.provider,
        to: options.to,
        subject: options.subject,
        error,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if email service is enabled
   */
  isEnabled(): boolean {
    return this.config.provider !== "disabled";
  }

  /**
   * Get configuration (excluding sensitive data)
   */
  getConfig() {
    return {
      provider: this.config.provider,
      from: this.config.from,
      fromName: this.config.fromName,
      baseUrl: this.config.baseUrl,
      isEnabled: this.isEnabled(),
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types
export type { EmailOptions, EmailProvider, EmailConfig };
