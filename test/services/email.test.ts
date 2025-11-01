import { expect } from "chai";
import { emailService } from "../../scripts/services/email.service";
import {
  emailTemplateService,
  EmailTemplateType,
} from "../../scripts/services/email-templates.service";
import { emailQueueService } from "../../scripts/services/email-queue.service";

describe("Email Services", () => {
  before(async () => {
    // Initialize services
    await emailService.initialize();
    await emailQueueService.initialize();
  });

  after(async () => {
    // Close queue service
    await emailQueueService.close();
  });

  describe("Email Service", () => {
    it("should initialize successfully", () => {
      expect(emailService.isEnabled).to.be.a("function");
      const config = emailService.getConfig();
      expect(config).to.have.property("provider");
      expect(config).to.have.property("from");
    });

    it("should send email when provider is disabled (mock mode)", async () => {
      const result = await emailService.sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
        text: "Test content",
      });

      expect(result).to.have.property("success");
      if (emailService.isEnabled()) {
        expect(result.success).to.be.true;
        expect(result).to.have.property("messageId");
      }
    });
  });

  describe("Email Template Service", () => {
    it("should generate welcome email template", () => {
      const template = emailTemplateService.getTemplate("welcome", {
        userName: "John Doe",
      });

      expect(template).to.have.property("subject");
      expect(template).to.have.property("html");
      expect(template).to.have.property("text");
      expect(template.subject).to.equal("Welcome to Internet ID");
      expect(template.html).to.include("John Doe");
      expect(template.text).to.include("John Doe");
    });

    it("should generate verification success template", () => {
      const template = emailTemplateService.getTemplate("verification_success", {
        contentHash: "0xabc123",
        manifestUri: "ipfs://QmTest",
        creatorAddress: "0x123456",
      });

      expect(template.subject).to.include("Successful");
      expect(template.html).to.include("0xabc123");
      expect(template.html).to.include("ipfs://QmTest");
      expect(template.text).to.include("0x123456");
    });

    it("should generate platform binding template", () => {
      const template = emailTemplateService.getTemplate("platform_binding", {
        platform: "youtube",
        platformId: "video123",
        contentHash: "0xhash",
      });

      expect(template.subject).to.include("youtube");
      expect(template.html).to.include("video123");
      expect(template.text).to.include("0xhash");
    });

    it("should generate security alert template", () => {
      const template = emailTemplateService.getTemplate("security_alert_login", {
        ipAddress: "192.168.1.1",
        location: "San Francisco, CA",
        device: "Chrome on Windows",
        timestamp: new Date().toISOString(),
      });

      expect(template.subject).to.include("Security Alert");
      expect(template.html).to.include("192.168.1.1");
      expect(template.html).to.include("San Francisco");
    });

    it("should throw error for unknown template type", () => {
      expect(() => {
        emailTemplateService.getTemplate("unknown" as EmailTemplateType, {});
      }).to.throw();
    });
  });

  // Note: Notification service tests require database connection
  // They are covered in integration tests instead

  describe("Email Queue Service", () => {
    it("should get queue stats", async () => {
      const stats = await emailQueueService.getStats();

      expect(stats).to.have.property("available");
      if (stats.available) {
        expect(stats).to.have.property("waiting");
        expect(stats).to.have.property("active");
        expect(stats).to.have.property("completed");
        expect(stats).to.have.property("failed");
      }
    });

    it("should queue an email", async function () {
      // Skip if queue not available (no Redis)
      if (!emailQueueService.isAvailable()) {
        this.skip();
      }

      const jobId = await emailQueueService.queueEmail({
        userId: "test-user-123",
        to: "test@example.com",
        templateType: "welcome",
        templateData: {
          userName: "Test User",
        },
      });

      expect(jobId).to.be.a("string");
    });
  });

  // Note: Email delivery tracking and preferences filtering tests require database
  // They are covered in integration tests
});
