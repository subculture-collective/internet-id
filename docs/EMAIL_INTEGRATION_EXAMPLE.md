# Email Notification Integration Examples

This document provides examples of how to integrate email notifications into existing workflows.

## 1. Send Welcome Email on User Registration

```typescript
// In your user registration endpoint or NextAuth callback

import { notificationService } from "../services/notification.service";

// After user is created
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
    address: "0x123...",
  },
});

// Send welcome email
if (user.email) {
  await notificationService.sendWelcomeEmail(user.id, user.email, user.name || undefined);
}
```

## 2. Send Verification Updates During Content Registration

```typescript
// In scripts/routes/register.routes.ts or content registration flow

import { notificationService } from "../services/notification.service";

router.post("/register", async (req: Request, res: Response) => {
  try {
    // ... existing registration logic ...

    const tx = await registry.register(fileHash, manifestURI);
    const receipt = await tx.wait();

    // Store in database
    const user = await prisma.user.findUnique({
      where: { address: creatorAddress },
    });

    const content = await prisma.content.create({
      data: {
        contentHash: fileHash,
        manifestUri: manifestURI,
        creatorAddress,
        creatorId: user?.id,
        registryAddress,
        txHash: receipt?.hash,
      },
    });

    // Send verification success email
    if (user && user.email) {
      await notificationService.sendVerificationSuccess(user.id, user.email, {
        contentHash: fileHash,
        manifestUri: manifestURI,
        creatorAddress,
      });
    }

    res.json({
      contentHash: fileHash,
      manifestURI,
      txHash: receipt?.hash,
    });
  } catch (error) {
    // On error, send failure notification
    if (user && user.email && fileHash) {
      await notificationService.sendVerificationFailure(user.id, user.email, {
        contentHash: fileHash,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }

    res.status(500).json({ error: error.message });
  }
});
```

## 3. Send Platform Binding Confirmation

```typescript
// In scripts/routes/binding.routes.ts

import { notificationService } from "../services/notification.service";

router.post("/bind", async (req: Request, res: Response) => {
  try {
    // ... existing binding logic ...

    const tx = await registry.bindPlatform(contentHash, platform, platformId);
    await tx.wait();

    // Store binding
    await prisma.platformBinding.create({
      data: {
        platform,
        platformId,
        contentId: content.id,
      },
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: content.creatorId },
    });

    // Send binding confirmation email
    if (user && user.email) {
      await notificationService.sendPlatformBinding(user.id, user.email, {
        platform,
        platformId,
        contentHash,
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 4. Send Transaction Notifications

```typescript
// For any on-chain transaction that might take time

import { notificationService } from "../services/notification.service";

async function registerWithNotifications(
  userId: string,
  userEmail: string,
  fileHash: string,
  manifestURI: string,
  registryAddress: string
) {
  try {
    // Send pending notification
    await notificationService.sendVerificationPending(userId, userEmail, { contentHash: fileHash });

    // Perform registration
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const registry = new ethers.Contract(registryAddress, ABI, wallet);

    const tx = await registry.register(fileHash, manifestURI);

    // Send transaction notification
    await notificationService.sendTransactionNotification(userId, userEmail, {
      txHash: tx.hash,
      chainId: (await provider.getNetwork()).chainId,
      type: "Content Registration",
      status: "pending",
    });

    const receipt = await tx.wait();

    // Send success notification
    await notificationService.sendVerificationSuccess(userId, userEmail, {
      contentHash: fileHash,
      manifestUri: manifestURI,
      creatorAddress: await wallet.getAddress(),
    });

    // Send transaction confirmation
    await notificationService.sendTransactionNotification(userId, userEmail, {
      txHash: receipt.hash,
      chainId: (await provider.getNetwork()).chainId,
      type: "Content Registration",
      status: "confirmed",
    });

    return receipt;
  } catch (error) {
    // Send failure notification
    await notificationService.sendVerificationFailure(userId, userEmail, {
      contentHash: fileHash,
      reason: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
```

## 5. Send Security Alerts on Login

```typescript
// In NextAuth callbacks or authentication middleware

import { notificationService } from "../services/notification.service";

// In NextAuth callback
callbacks: {
  async signIn({ user, account }) {
    if (user.email && user.id) {
      // Send security alert for new login
      await notificationService.sendSecurityAlertLogin(
        user.id,
        user.email,
        {
          ipAddress: req.ip,
          location: await getLocationFromIP(req.ip),
          device: req.headers["user-agent"],
          timestamp: new Date().toISOString(),
        }
      );
    }
    return true;
  }
}
```

## 6. Batch Email Processing for Daily Digests

```typescript
// In a scheduled job or cron task

import { notificationService } from "../services/notification.service";
import { prisma } from "../db";

async function sendDailyDigest() {
  // Find users with daily_digest preference
  const users = await prisma.user.findMany({
    where: {
      emailPreferences: {
        frequency: "daily_digest",
        unsubscribedAt: null,
      },
    },
    include: {
      emailPreferences: true,
    },
  });

  for (const user of users) {
    if (!user.email) continue;

    // Collect activity from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentContents = await prisma.content.findMany({
      where: {
        creatorId: user.id,
        createdAt: { gte: yesterday },
      },
    });

    const recentBindings = await prisma.platformBinding.findMany({
      where: {
        content: { creatorId: user.id },
        createdAt: { gte: yesterday },
      },
    });

    // Only send if there's activity
    if (recentContents.length > 0 || recentBindings.length > 0) {
      // Note: You would need to create a digest template
      // This is a placeholder for demonstration
      console.log(`Would send digest to ${user.email}`);
    }
  }
}

// Run daily at 9 AM
// cron.schedule("0 9 * * *", sendDailyDigest);
```

## 7. Handle Email Preferences in User Profile

```typescript
// In a user profile update endpoint

router.put("/profile/email-preferences", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // From auth middleware
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

    res.json({ success: true, message: "Preferences updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 8. Create Unsubscribe Landing Page

```typescript
// In web/app/unsubscribe/page.tsx

import { notificationService } from "@/lib/notification.service";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { userId?: string; token?: string };
}) {
  const { userId, token } = searchParams;

  if (!userId) {
    return <div>Invalid unsubscribe link</div>;
  }

  // Verify token if needed
  // ...

  // Handle unsubscribe action
  if (userId) {
    await notificationService.unsubscribe(userId);
  }

  return (
    <div>
      <h1>Unsubscribed Successfully</h1>
      <p>You've been unsubscribed from all emails.</p>
      <p>
        You can update your preferences or resubscribe at any time in your{" "}
        <a href="/preferences">account settings</a>.
      </p>
    </div>
  );
}
```

## 9. Email Preference Center UI

```typescript
// In web/app/preferences/page.tsx

"use client";

import { useState, useEffect } from "react";

export default function EmailPreferencesPage() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    const response = await fetch("/api/notifications/preferences");
    const data = await response.json();
    setPreferences(data);
    setLoading(false);
  }

  async function updatePreferences(updates: any) {
    await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await fetchPreferences();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Email Preferences</h1>

      <div className="space-y-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={preferences?.welcomeEmails}
            onChange={(e) =>
              updatePreferences({ welcomeEmails: e.target.checked })
            }
          />
          <span>Welcome emails</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={preferences?.verificationUpdates}
            onChange={(e) =>
              updatePreferences({ verificationUpdates: e.target.checked })
            }
          />
          <span>Verification updates</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={preferences?.platformBindingConfirmations}
            onChange={(e) =>
              updatePreferences({
                platformBindingConfirmations: e.target.checked,
              })
            }
          />
          <span>Platform binding confirmations</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={preferences?.transactionNotifications}
            onChange={(e) =>
              updatePreferences({
                transactionNotifications: e.target.checked,
              })
            }
          />
          <span>Transaction notifications</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={preferences?.securityAlerts}
            onChange={(e) =>
              updatePreferences({ securityAlerts: e.target.checked })
            }
          />
          <span>Security alerts</span>
        </label>

        <div className="pt-4">
          <label className="block text-sm font-medium mb-2">
            Email Frequency
          </label>
          <select
            value={preferences?.frequency}
            onChange={(e) =>
              updatePreferences({ frequency: e.target.value })
            }
            className="border rounded px-3 py-2"
          >
            <option value="immediate">Immediate</option>
            <option value="daily_digest">Daily Digest</option>
          </select>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t">
        <button
          onClick={async () => {
            await fetch("/api/notifications/unsubscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: preferences.userId }),
            });
            await fetchPreferences();
          }}
          className="text-red-600 hover:text-red-700"
        >
          Unsubscribe from all emails
        </button>
      </div>
    </div>
  );
}
```

## Best Practices

1. **Always check for user email before sending:**

   ```typescript
   if (user && user.email) {
     await notificationService.sendEmail(...)
   }
   ```

2. **Don't block main operations on email sending:**
   - Emails are queued asynchronously
   - Failures don't affect main operation
   - Use try/catch to handle errors gracefully

3. **Respect user preferences:**
   - Always check if notifications are enabled
   - Honor unsubscribe status
   - Provide easy opt-out mechanisms

4. **Log important events:**
   - All emails are automatically logged to EmailLog table
   - Use this for debugging and analytics

5. **Test with disabled provider:**
   - System works without EMAIL_PROVIDER set
   - Useful for local development
   - Emails logged but not sent

6. **Monitor queue health:**
   - Check `/api/notifications/queue/stats` regularly
   - Alert on high failure rates
   - Watch for growing queue depths
