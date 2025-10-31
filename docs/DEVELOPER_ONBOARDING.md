# Developer Onboarding Guide

Welcome to the Internet ID developer community! This guide will help you get started with integrating Internet ID's content provenance platform into your application.

## Quick Start

### 1. Choose Your Authentication Method

Internet ID API supports two authentication methods:

#### Option A: API Keys (Recommended for Server-Side Apps)

Best for:

- Backend services
- Server-to-server integrations
- Automated scripts and bots

#### Option B: JWT Tokens (Recommended for User-Scoped Access)

Best for:

- User-facing applications
- Mobile apps
- Frontend applications needing user-specific access

### 2. Get Your Credentials

#### For API Keys:

You'll need a JWT token first to create API keys. Follow these steps:

1. **Sign a message with your wallet** (using MetaMask, WalletConnect, etc.):

```typescript
import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const message = "Sign in to Internet ID API";
const signature = await signer.signMessage(message);
const address = await signer.getAddress();
```

2. **Generate a JWT token**:

```bash
curl -X POST https://api.internet-id.io/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234...",
    "signature": "0xabc...",
    "message": "Sign in to Internet ID API"
  }'
```

3. **Create an API key** using the JWT token:

```bash
curl -X POST https://api.internet-id.io/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Application",
    "tier": "free"
  }'
```

⚠️ **Save your API key immediately!** It will only be shown once.

#### For JWT Tokens:

Generate tokens as shown above. Tokens expire after 24 hours and need to be regenerated.

### 3. Install the SDK (Optional but Recommended)

```bash
npm install @internet-id/sdk
```

Or use direct HTTP requests with your preferred HTTP client.

### 4. Make Your First API Call

#### Using the SDK:

```typescript
import { InternetIdClient } from "@internet-id/sdk";

const client = new InternetIdClient({
  apiKey: "iid_your_api_key_here",
});

// Verify a YouTube video
const result = await client.verifyByPlatform({
  url: "https://youtube.com/watch?v=abc123",
});

if (result.verified) {
  console.log("✅ Content is verified!");
  console.log("Creator:", result.creator);
  console.log("Registered on:", new Date(result.timestamp * 1000));
} else {
  console.log("❌ Content not verified");
}
```

#### Using cURL:

```bash
curl -H "x-api-key: iid_your_api_key_here" \
  "https://api.internet-id.io/api/v1/verify/platform?url=https://youtube.com/watch?v=abc123"
```

## Common Use Cases

### Verify Content on Your Platform

```typescript
import { InternetIdClient } from "@internet-id/sdk";

const client = new InternetIdClient({ apiKey: process.env.INTERNET_ID_API_KEY });

async function checkContentAuthenticity(platformUrl: string) {
  try {
    const result = await client.verifyByPlatform({ url: platformUrl });

    if (result.verified) {
      return {
        isVerified: true,
        creator: result.creator,
        registeredAt: new Date(result.timestamp * 1000),
        blockchain: result.chainId,
        manifest: result.manifest,
      };
    }

    return { isVerified: false };
  } catch (error) {
    console.error("Verification failed:", error);
    return { isVerified: false, error };
  }
}

// Usage
const verification = await checkContentAuthenticity("https://youtube.com/watch?v=xyz");
console.log(verification);
```

### List All Your Verified Content

```typescript
async function listUserContent(creatorAddress: string) {
  const client = new InternetIdClient({ apiKey: process.env.INTERNET_ID_API_KEY });

  const response = await client.listContent({
    creator: creatorAddress,
    limit: 50,
    offset: 0,
  });

  return response.data.map((item) => ({
    hash: item.contentHash,
    platforms: item.bindings?.map((b) => `${b.platform}/${b.platformId}`),
    createdAt: new Date(item.createdAt),
  }));
}
```

### Display Verification Badge

```typescript
async function getVerificationBadge(contentUrl: string) {
  const client = new InternetIdClient({ apiKey: process.env.INTERNET_ID_API_KEY });

  const result = await client.verifyByPlatform({ url: contentUrl });

  if (result.verified) {
    return {
      type: "verified",
      text: "✓ Verified by Internet ID",
      creator: result.creator,
      badgeUrl: `https://api.internet-id.io/api/badge/${result.contentHash}?theme=light&w=200`,
    };
  }

  return { type: "unverified", text: "Not verified" };
}
```

### Monitor Content Verification Status

```typescript
import { InternetIdClient } from "@internet-id/sdk";

class VerificationMonitor {
  private client: InternetIdClient;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(apiKey: string) {
    this.client = new InternetIdClient({ apiKey });
  }

  startMonitoring(contentHashes: string[], onUpdate: (hash: string, verified: boolean) => void) {
    this.checkInterval = setInterval(async () => {
      for (const hash of contentHashes) {
        try {
          const result = await this.client.verifyByHash(hash);
          onUpdate(hash, result.verified && !result.revoked);
        } catch (error) {
          console.error(`Failed to check ${hash}:`, error);
        }
      }
    }, 60000); // Check every minute
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Usage
const monitor = new VerificationMonitor(process.env.INTERNET_ID_API_KEY!);
monitor.startMonitoring(["0xabc...", "0xdef..."], (hash, verified) => {
  console.log(`${hash}: ${verified ? "✓" : "✗"}`);
});
```

## Best Practices

### 1. Security

- **Never expose API keys** in client-side code or public repositories
- Store keys in environment variables or secure secret management systems
- Rotate keys regularly (every 90 days recommended)
- Use JWT tokens for user-facing applications instead of sharing API keys
- Implement proper error handling to avoid leaking sensitive information

### 2. Rate Limiting

- Implement exponential backoff for retries
- Cache verification results to reduce API calls
- Batch requests when possible
- Monitor your rate limit usage through response headers

```typescript
// Example: Exponential backoff retry
async function verifyWithRetry(client: InternetIdClient, url: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.verifyByPlatform({ url });
    } catch (error: any) {
      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### 3. Caching

- Cache verification results for at least 5 minutes
- Implement cache invalidation for revoked content
- Consider using Redis or similar for distributed caching

```typescript
// Example: Simple in-memory cache
class VerificationCache {
  private cache = new Map<string, { result: any; expires: number }>();

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.result;
  }

  set(key: string, result: any, ttlSeconds = 300) {
    this.cache.set(key, {
      result,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }
}
```

### 4. Error Handling

- Always handle both network errors and API errors
- Implement appropriate fallbacks for verification failures
- Log errors for debugging but don't expose details to end users

```typescript
async function safeVerify(client: InternetIdClient, url: string) {
  try {
    const result = await client.verifyByPlatform({ url });
    return { success: true, data: result };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { success: true, data: { verified: false, reason: "not_registered" } };
    }
    if (error.response?.status === 429) {
      return { success: false, reason: "rate_limit_exceeded" };
    }
    console.error("Verification error:", error);
    return { success: false, reason: "unknown_error" };
  }
}
```

## Testing

### Development Environment

For testing, point to the development server:

```typescript
const client = new InternetIdClient({
  baseURL: "http://localhost:3001/api/v1",
  apiKey: "iid_test_key",
});
```

### Test Data

Use test content hashes and platform IDs for development:

- Test hash: `0x0000000000000000000000000000000000000000000000000000000000000001`
- Test platform: `youtube`
- Test platform ID: `test_video_123`

## API Explorer

Explore the API interactively using Swagger UI:

- **Development**: http://localhost:3001/api/docs
- **Production**: https://api.internet-id.io/api/docs _(placeholder)_

## Support & Community

- **Documentation**: [Public API Docs](./PUBLIC_API.md)
- **GitHub Issues**: https://github.com/subculture-collective/internet-id/issues
- **Example Apps**: https://github.com/subculture-collective/internet-id/tree/main/examples _(coming soon)_

## Next Steps

1. ✅ Get your API credentials
2. ✅ Make your first API call
3. 📚 Read the [full API documentation](./PUBLIC_API.md)
4. 🔍 Explore the [Swagger UI](http://localhost:3001/api/docs)
5. 💻 Check out [example integrations](#) _(coming soon)_
6. 🚀 Build something awesome!

## Feedback

We'd love to hear about your experience! Please:

- Open an issue for bugs or feature requests
- Share your integration on our community forum _(coming soon)_
- Contribute to the SDK or documentation

Happy building! 🎉
