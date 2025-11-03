/**
 * Email Template Service
 * Provides HTML and plain text templates for various notification types
 */

// Template types
export type EmailTemplateType =
  | "welcome"
  | "verification_success"
  | "verification_failure"
  | "verification_pending"
  | "platform_binding"
  | "transaction_notification"
  | "security_alert_login"
  | "security_alert_password_change";

interface TemplateData {
  [key: string]: string | number | boolean | undefined;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailTemplateService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.EMAIL_BASE_URL || process.env.NEXT_PUBLIC_SITE_BASE || "http://localhost:3000";
  }

  /**
   * Get email template by type
   */
  getTemplate(type: EmailTemplateType, data: TemplateData): EmailTemplate {
    switch (type) {
      case "welcome":
        return this.welcomeTemplate(data);
      case "verification_success":
        return this.verificationSuccessTemplate(data);
      case "verification_failure":
        return this.verificationFailureTemplate(data);
      case "verification_pending":
        return this.verificationPendingTemplate(data);
      case "platform_binding":
        return this.platformBindingTemplate(data);
      case "transaction_notification":
        return this.transactionNotificationTemplate(data);
      case "security_alert_login":
        return this.securityAlertLoginTemplate(data);
      case "security_alert_password_change":
        return this.securityAlertPasswordChangeTemplate(data);
      default:
        throw new Error(`Unknown template type: ${type}`);
    }
  }

  /**
   * Welcome email template
   */
  private welcomeTemplate(data: TemplateData): EmailTemplate {
    const { userName } = data;

    return {
      subject: "Welcome to Internet ID",
      html: this.wrapHtml(`
        <h1>Welcome to Internet ID!</h1>
        <p>Hi ${userName || "there"},</p>
        <p>Thank you for joining Internet ID - the platform for anchoring human-created content on the blockchain.</p>
        <h2>Getting Started</h2>
        <ul>
          <li><strong>Upload Content:</strong> Register your original content with cryptographic proof</li>
          <li><strong>Verify Content:</strong> Check the authenticity of content across platforms</li>
          <li><strong>Platform Bindings:</strong> Link your YouTube, Twitter, and other social media posts</li>
        </ul>
        <p><a href="${this.baseUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">Go to Dashboard</a></p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Internet ID Team</p>
      `),
      text: `Welcome to Internet ID!

Hi ${userName || "there"},

Thank you for joining Internet ID - the platform for anchoring human-created content on the blockchain.

Getting Started:
- Upload Content: Register your original content with cryptographic proof
- Verify Content: Check the authenticity of content across platforms
- Platform Bindings: Link your YouTube, Twitter, and other social media posts

Visit your dashboard: ${this.baseUrl}/dashboard

If you have any questions, feel free to reach out to our support team.

Best regards,
The Internet ID Team`,
    };
  }

  /**
   * Verification success template
   */
  private verificationSuccessTemplate(data: TemplateData): EmailTemplate {
    const { contentHash, manifestUri, creatorAddress } = data;

    return {
      subject: "Content Verification Successful ✓",
      html: this.wrapHtml(`
        <h1>Content Verification Successful</h1>
        <p>Great news! Your content has been successfully verified on the blockchain.</p>
        <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Content Hash:</strong> ${contentHash}</p>
          <p style="margin: 4px 0;"><strong>Creator:</strong> ${creatorAddress}</p>
          <p style="margin: 4px 0;"><strong>Manifest:</strong> ${manifestUri}</p>
        </div>
        <p>Your content is now anchored on-chain and can be verified by anyone.</p>
        <p><a href="${this.baseUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">View in Dashboard</a></p>
      `),
      text: `Content Verification Successful

Great news! Your content has been successfully verified on the blockchain.

Content Hash: ${contentHash}
Creator: ${creatorAddress}
Manifest: ${manifestUri}

Your content is now anchored on-chain and can be verified by anyone.

View in dashboard: ${this.baseUrl}/dashboard`,
    };
  }

  /**
   * Verification failure template
   */
  private verificationFailureTemplate(data: TemplateData): EmailTemplate {
    const { contentHash, reason } = data;

    return {
      subject: "Content Verification Failed",
      html: this.wrapHtml(`
        <h1>Content Verification Failed</h1>
        <p>Unfortunately, we were unable to verify your content.</p>
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 4px 0;"><strong>Content Hash:</strong> ${contentHash}</p>
          <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason || "Unknown error"}</p>
        </div>
        <p>Please check your content and try again. If you continue to experience issues, contact our support team.</p>
        <p><a href="${this.baseUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">Try Again</a></p>
      `),
      text: `Content Verification Failed

Unfortunately, we were unable to verify your content.

Content Hash: ${contentHash}
Reason: ${reason || "Unknown error"}

Please check your content and try again. If you continue to experience issues, contact our support team.

Dashboard: ${this.baseUrl}/dashboard`,
    };
  }

  /**
   * Verification pending template
   */
  private verificationPendingTemplate(data: TemplateData): EmailTemplate {
    const { contentHash } = data;

    return {
      subject: "Content Verification Pending",
      html: this.wrapHtml(`
        <h1>Content Verification Pending</h1>
        <p>Your content verification is being processed.</p>
        <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 4px 0;"><strong>Content Hash:</strong> ${contentHash}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> Pending blockchain confirmation</p>
        </div>
        <p>This process typically takes a few minutes. We'll send you another email once verification is complete.</p>
        <p><a href="${this.baseUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">Check Status</a></p>
      `),
      text: `Content Verification Pending

Your content verification is being processed.

Content Hash: ${contentHash}
Status: Pending blockchain confirmation

This process typically takes a few minutes. We'll send you another email once verification is complete.

Check status: ${this.baseUrl}/dashboard`,
    };
  }

  /**
   * Platform binding template
   */
  private platformBindingTemplate(data: TemplateData): EmailTemplate {
    const { platform, platformId, contentHash } = data;

    return {
      subject: `Platform Binding Confirmed: ${platform}`,
      html: this.wrapHtml(`
        <h1>Platform Binding Confirmed</h1>
        <p>Your content has been successfully linked to your ${platform} account.</p>
        <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Platform:</strong> ${platform}</p>
          <p style="margin: 4px 0;"><strong>Platform ID:</strong> ${platformId}</p>
          <p style="margin: 4px 0;"><strong>Content Hash:</strong> ${contentHash}</p>
        </div>
        <p>Anyone can now verify your content directly from the ${platform} platform.</p>
        <p><a href="${this.baseUrl}/verify?platform=${platform}&platformId=${platformId}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">View Verification</a></p>
      `),
      text: `Platform Binding Confirmed

Your content has been successfully linked to your ${platform} account.

Platform: ${platform}
Platform ID: ${platformId}
Content Hash: ${contentHash}

Anyone can now verify your content directly from the ${platform} platform.

View verification: ${this.baseUrl}/verify?platform=${platform}&platformId=${platformId}`,
    };
  }

  /**
   * Transaction notification template
   */
  private transactionNotificationTemplate(data: TemplateData): EmailTemplate {
    const { txHash, chainId, type, status } = data;
    const explorerUrl = this.getExplorerUrl(chainId as number, txHash as string);

    return {
      subject: `Transaction ${status}: ${type}`,
      html: this.wrapHtml(`
        <h1>Transaction Notification</h1>
        <p>A blockchain transaction has been ${status}.</p>
        <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Type:</strong> ${type}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${status}</p>
          <p style="margin: 4px 0;"><strong>Transaction Hash:</strong> ${txHash}</p>
          <p style="margin: 4px 0;"><strong>Chain ID:</strong> ${chainId}</p>
        </div>
        ${explorerUrl ? `<p><a href="${explorerUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">View on Explorer</a></p>` : ""}
      `),
      text: `Transaction Notification

A blockchain transaction has been ${status}.

Type: ${type}
Status: ${status}
Transaction Hash: ${txHash}
Chain ID: ${chainId}

${explorerUrl ? `View on explorer: ${explorerUrl}` : ""}`,
    };
  }

  /**
   * Security alert: new login template
   */
  private securityAlertLoginTemplate(data: TemplateData): EmailTemplate {
    const { ipAddress, location, device, timestamp } = data;

    return {
      subject: "Security Alert: New Login Detected",
      html: this.wrapHtml(`
        <h1>New Login Detected</h1>
        <p>A new login to your Internet ID account was detected.</p>
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 4px 0;"><strong>Time:</strong> ${timestamp}</p>
          <p style="margin: 4px 0;"><strong>IP Address:</strong> ${ipAddress || "Unknown"}</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> ${location || "Unknown"}</p>
          <p style="margin: 4px 0;"><strong>Device:</strong> ${device || "Unknown"}</p>
        </div>
        <p><strong>Was this you?</strong> If you recognize this activity, you can safely ignore this email.</p>
        <p><strong>Not you?</strong> Please secure your account immediately by changing your password.</p>
        <p><a href="${this.baseUrl}/profile" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">Secure Account</a></p>
      `),
      text: `Security Alert: New Login Detected

A new login to your Internet ID account was detected.

Time: ${timestamp}
IP Address: ${ipAddress || "Unknown"}
Location: ${location || "Unknown"}
Device: ${device || "Unknown"}

Was this you? If you recognize this activity, you can safely ignore this email.

Not you? Please secure your account immediately by changing your password.

Secure account: ${this.baseUrl}/profile`,
    };
  }

  /**
   * Security alert: password change template
   */
  private securityAlertPasswordChangeTemplate(data: TemplateData): EmailTemplate {
    const { timestamp } = data;

    return {
      subject: "Security Alert: Password Changed",
      html: this.wrapHtml(`
        <h1>Password Changed</h1>
        <p>The password for your Internet ID account was successfully changed.</p>
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 4px 0;"><strong>Time:</strong> ${timestamp}</p>
        </div>
        <p><strong>Was this you?</strong> If you made this change, you can safely ignore this email.</p>
        <p><strong>Not you?</strong> Please contact our support team immediately.</p>
        <p><a href="${this.baseUrl}/profile" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">Contact Support</a></p>
      `),
      text: `Security Alert: Password Changed

The password for your Internet ID account was successfully changed.

Time: ${timestamp}

Was this you? If you made this change, you can safely ignore this email.

Not you? Please contact our support team immediately.

Contact support: ${this.baseUrl}/profile`,
    };
  }

  /**
   * Wrap HTML content in email layout
   */
  private wrapHtml(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Internet ID</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0070f3; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Internet ID</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                Internet ID - Human-Created Content Anchoring
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                <a href="${this.baseUrl}/preferences" style="color: #6b7280; text-decoration: none;">Email Preferences</a> | 
                <a href="${this.baseUrl}/unsubscribe" style="color: #6b7280; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Get block explorer URL for transaction
   */
  private getExplorerUrl(chainId: number, txHash: string): string | null {
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      137: "https://polygonscan.com",
      8453: "https://basescan.org",
      42161: "https://arbiscan.io",
      10: "https://optimistic.etherscan.io",
      11155111: "https://sepolia.etherscan.io",
      80002: "https://amoy.polygonscan.com",
      84532: "https://sepolia.basescan.org",
      421614: "https://sepolia.arbiscan.io",
      11155420: "https://sepolia-optimism.etherscan.io",
    };

    const baseUrl = explorers[chainId];
    return baseUrl ? `${baseUrl}/tx/${txHash}` : null;
  }

  /**
   * Get unsubscribe link with token
   */
  getUnsubscribeLink(userId: string, token: string): string {
    return `${this.baseUrl}/unsubscribe?userId=${userId}&token=${token}`;
  }

  /**
   * Get preference center link
   */
  getPreferenceLink(userId: string): string {
    return `${this.baseUrl}/preferences?userId=${userId}`;
  }
}

// Export singleton instance
export const emailTemplateService = new EmailTemplateService();

// Export types
export type { TemplateData, EmailTemplate };
