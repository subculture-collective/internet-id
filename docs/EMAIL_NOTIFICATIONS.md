# Email Notification System

This document describes the email notification system for Internet ID.

## Overview

The email notification system provides transactional emails to keep users informed about:
- Verification status updates (success, failure, pending)
- Platform binding confirmations
- On-chain transaction notifications
- Security alerts (new login, password change)
- Welcome messages for new users

## Architecture

### Components

1. **Email Service** (`scripts/services/email.service.ts`)
   - Multi-provider abstraction layer
   - Supports SendGrid, Postmark, AWS SES, and SMTP
   - Automatic initialization and configuration

2. **Email Template Service** (`scripts/services/email-templates.service.ts`)
   - Responsive HTML + plain text templates
   - Dynamic content generation
   - Unsubscribe links in all emails

3. **Email Queue Service** (`scripts/services/email-queue.service.ts`)
   - Async email processing with BullMQ
   - Retry logic with exponential backoff
   - Priority-based queue
   - Email delivery tracking

4. **Notification Service** (`scripts/services/notification.service.ts`)
   - High-level API for sending notifications
   - User preference checking
   - Email stats and logging

### Database Schema

#### EmailPreferences
```prisma
model EmailPreferences {
  id                             String   @id @default(cuid())
  userId                         String   @unique
  welcomeEmails                  Boolean  @default(true)
  verificationUpdates            Boolean  @default(true)
  platformBindingConfirmations   Boolean  @default(true)
  transactionNotifications       Boolean  @default(true)
  securityAlerts                 Boolean  @default(true)
  frequency                      String   @default("immediate")
  unsubscribedAt                 DateTime?
}
```

#### EmailLog
```prisma
model EmailLog {
  id             String    @id @default(cuid())
  userId         String?
  recipient      String
  subject        String
  templateType   String
  status         String    // queued, sent, delivered, bounced, failed
  provider       String?
  providerId     String?
  error          String?
  sentAt         DateTime?
  deliveredAt    DateTime?
  retryCount     Int       @default(0)
}
```

## Configuration

### Environment Variables

```bash
# Email service provider (sendgrid, postmark, ses, smtp)
EMAIL_PROVIDER=sendgrid

# SendGrid Configuration
SENDGRID_API_KEY=your_key_here

# Postmark Configuration
POSTMARK_SERVER_TOKEN=your_token_here

# AWS SES Configuration
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=your_key_id
AWS_SES_SECRET_ACCESS_KEY=your_secret_key

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username
SMTP_PASS=password

# Email settings
EMAIL_FROM=noreply@internet-id.com
EMAIL_FROM_NAME=Internet ID
EMAIL_REPLY_TO=support@internet-id.com
EMAIL_BASE_URL=https://internet-id.com

# Redis for job queue (optional, falls back to sync)
REDIS_URL=redis://localhost:6379
```

### Provider Setup

#### SendGrid
1. Create account at https://sendgrid.com
2. Generate API key with "Mail Send" permissions
3. Add `SENDGRID_API_KEY` to environment

#### Postmark
1. Create account at https://postmarkapp.com
2. Generate server token
3. Add `POSTMARK_SERVER_TOKEN` to environment

#### AWS SES
1. Set up AWS SES and verify domain
2. Create IAM user with SES send permissions
3. Add AWS credentials to environment

#### SMTP
1. Get SMTP credentials from your email provider
2. Add SMTP configuration to environment

## Usage

### Sending Notifications

```typescript
import { notificationService } from "./services/notification.service";

// Send welcome email
await notificationService.sendWelcomeEmail(
  userId,
  userEmail,
  userName
);

// Send verification success
await notificationService.sendVerificationSuccess(
  userId,
  userEmail,
  {
    contentHash: "0xabc...",
    manifestUri: "ipfs://...",
    creatorAddress: "0x123...",
  }
);

// Send platform binding confirmation
await notificationService.sendPlatformBinding(
  userId,
  userEmail,
  {
    platform: "youtube",
    platformId: "video123",
    contentHash: "0xabc...",
  }
);

// Send security alert
await notificationService.sendSecurityAlertLogin(
  userId,
  userEmail,
  {
    ipAddress: "192.168.1.1",
    location: "San Francisco, CA",
    device: "Chrome on Windows",
    timestamp: new Date().toISOString(),
  }
);
```

### Managing User Preferences

```typescript
// Get preferences
const prefs = await notificationService.getEmailPreferences(userId);

// Update preferences
await notificationService.updateEmailPreferences(userId, {
  verificationUpdates: false,
  frequency: "daily_digest",
});

// Unsubscribe
await notificationService.unsubscribe(userId);

// Resubscribe
await notificationService.resubscribe(userId);

// Get email stats
const stats = await notificationService.getEmailStats(userId);
```

## API Endpoints

### GET /api/notifications/preferences
Get user's email preferences (requires authentication).

**Response:**
```json
{
  "id": "clxxx",
  "userId": "clyyy",
  "welcomeEmails": true,
  "verificationUpdates": true,
  "platformBindingConfirmations": true,
  "transactionNotifications": true,
  "securityAlerts": true,
  "frequency": "immediate",
  "unsubscribedAt": null
}
```

### PUT /api/notifications/preferences
Update email preferences (requires authentication).

**Request:**
```json
{
  "verificationUpdates": false,
  "frequency": "daily_digest"
}
```

### POST /api/notifications/unsubscribe
Unsubscribe from all emails.

**Request:**
```json
{
  "userId": "clyyy",
  "token": "optional_unsubscribe_token"
}
```

### GET /api/notifications/stats
Get email delivery statistics (requires authentication).

**Response:**
```json
{
  "total": 15,
  "sent": 12,
  "delivered": 10,
  "failed": 2,
  "bounced": 1,
  "recentEmails": [
    {
      "subject": "Welcome to Internet ID",
      "status": "delivered",
      "sentAt": "2025-01-15T10:30:00Z",
      "templateType": "welcome"
    }
  ]
}
```

### GET /api/notifications/logs
Get recent email logs (requires authentication).

**Query Parameters:**
- `limit`: Number of logs to return (default: 20, max: 100)

### GET /api/notifications/queue/stats
Get email queue statistics (admin only).

**Response:**
```json
{
  "available": true,
  "waiting": 5,
  "active": 2,
  "completed": 150,
  "failed": 3
}
```

## Email Templates

All templates include:
- Responsive HTML version
- Plain text fallback
- Unsubscribe link
- Preference center link
- Brand-consistent styling

### Available Templates

1. **welcome** - Welcome message for new users
2. **verification_success** - Content verified successfully
3. **verification_failure** - Verification failed
4. **verification_pending** - Verification in progress
5. **platform_binding** - Platform linked successfully
6. **transaction_notification** - Blockchain transaction update
7. **security_alert_login** - New login detected
8. **security_alert_password_change** - Password changed

## Job Queue

### Features
- **Async Processing:** Emails queued via BullMQ for background processing
- **Retry Logic:** 3 attempts with exponential backoff (5s, 10s, 20s)
- **Priority:** Security alerts have highest priority
- **Graceful Degradation:** Falls back to synchronous sending without Redis

### Queue Configuration
```typescript
{
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000  // 5 seconds
  },
  concurrency: 5  // Process 5 emails concurrently
}
```

## Testing

Run email service tests:
```bash
npm test test/services/email.test.ts
```

Tests cover:
- Email service initialization
- Template generation
- Queue operations
- Preference management

## Monitoring

### Email Delivery Metrics
- Total emails sent
- Delivery rate
- Bounce rate
- Failed sends
- Queue depth

### Queue Health
- Active jobs
- Waiting jobs
- Failed jobs
- Processing time

## Compliance

### CAN-SPAM Act
- ✅ Clear "From" name and email
- ✅ Unsubscribe link in all emails
- ✅ Physical address in footer
- ✅ Honor opt-out requests within 10 days

### GDPR
- ✅ Explicit consent for marketing emails
- ✅ Easy unsubscribe mechanism
- ✅ Data retention policies
- ✅ User can access their email logs

## Troubleshooting

### Emails not sending
1. Check `EMAIL_PROVIDER` is set
2. Verify provider credentials
3. Check email service logs
4. Test provider connection manually

### Queue not processing
1. Verify `REDIS_URL` is set and accessible
2. Check queue worker is running
3. Check failed jobs in queue stats
4. Review error logs in EmailLog table

### High bounce rate
1. Verify sender domain authentication (SPF, DKIM, DMARC)
2. Check email addresses are valid
3. Review email content for spam triggers
4. Monitor provider reputation score

## Future Enhancements

- [ ] Daily digest email aggregation
- [ ] Email open tracking
- [ ] Click tracking
- [ ] A/B testing for templates
- [ ] Webhook callbacks for delivery status
- [ ] Advanced email analytics dashboard
- [ ] Multi-language support
- [ ] Custom email templates via UI
