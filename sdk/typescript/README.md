# Internet ID TypeScript/JavaScript SDK

Official TypeScript/JavaScript SDK for the Internet ID Public API.

## Installation

```bash
npm install @internet-id/sdk
```

## Quick Start

### Using API Key

```typescript
import { InternetIdClient } from "@internet-id/sdk";

const client = new InternetIdClient({
  apiKey: "iid_your_api_key_here",
});

// Verify content by YouTube URL
const result = await client.verifyByPlatform({
  url: "https://youtube.com/watch?v=abc123",
});

console.log(result.verified); // true or false
console.log(result.creator); // Creator's Ethereum address
```

### Using JWT Token

```typescript
import { InternetIdClient } from "@internet-id/sdk";
import { ethers } from "ethers";

// 1. Sign a message with your wallet
const wallet = new ethers.Wallet("your_private_key");
const message = "Sign in to Internet ID API";
const signature = await wallet.signMessage(message);

// 2. Generate JWT token
const client = new InternetIdClient();
const authResponse = await client.generateToken({
  address: wallet.address,
  signature,
  message,
});

// 3. Use the JWT token for authenticated requests
client.setJwtToken(authResponse.token);

// Now you can make authenticated requests
const apiKey = await client.createApiKey({
  name: "My Application Key",
  tier: "free",
});

console.log("Save this key:", apiKey.data.key);
```

## API Reference

### Verification

#### `verifyByPlatform(params)`

Verify content by platform URL or platform + platformId.

```typescript
// By URL
const result = await client.verifyByPlatform({
  url: "https://youtube.com/watch?v=abc123",
});

// By platform and ID
const result = await client.verifyByPlatform({
  platform: "youtube",
  platformId: "abc123",
});
```

#### `verifyByHash(hash)`

Verify content by content hash.

```typescript
const result = await client.verifyByHash("0x123...");
```

### Content Metadata

#### `listContent(params?)`

List registered content with pagination.

```typescript
const response = await client.listContent({
  limit: 20,
  offset: 0,
  creator: "0x123...", // optional filter by creator
});

console.log(response.data); // Array of content items
console.log(response.pagination); // Pagination info
```

#### `getContentById(id)`

Get content by database ID.

```typescript
const content = await client.getContentById("cuid123");
```

#### `getContentByHash(hash)`

Get content by content hash.

```typescript
const content = await client.getContentByHash("0x123...");
```

### API Key Management

Requires authentication via JWT token.

#### `createApiKey(params?)`

Create a new API key.

```typescript
const result = await client.createApiKey({
  name: "Production Key",
  tier: "free", // or 'paid'
  expiresAt: "2024-12-31T23:59:59Z", // optional
});

// IMPORTANT: Save the key immediately, it won't be shown again
console.log("API Key:", result.data.key);
```

#### `listApiKeys()`

List all your API keys.

```typescript
const keys = await client.listApiKeys();
console.log(keys.data); // Array of API keys (without the actual key values)
```

#### `revokeApiKey(keyId)`

Revoke an API key (makes it inactive but doesn't delete it).

```typescript
await client.revokeApiKey("key-id");
```

#### `deleteApiKey(keyId)`

Permanently delete an API key.

```typescript
await client.deleteApiKey("key-id");
```

### Authentication

#### `generateToken(params)`

Generate a JWT token by signing a message with your wallet.

```typescript
const response = await client.generateToken({
  address: "0x123...",
  signature: "0xabc...",
  message: "Sign in to Internet ID API",
});

console.log(response.token); // JWT token
console.log(response.expiresIn); // "24h"
```

## Configuration

```typescript
const client = new InternetIdClient({
  baseURL: "https://api.internet-id.io/api/v1", // API base URL
  apiKey: "iid_xxx", // API key (optional)
  jwtToken: "eyJ...", // JWT token (optional)
  timeout: 30000, // Request timeout in milliseconds (default: 30000)
});
```

## Error Handling

All methods throw errors on failure. Use try-catch blocks:

```typescript
try {
  const result = await client.verifyByPlatform({
    url: "https://youtube.com/watch?v=invalid",
  });
} catch (error) {
  console.error("Verification failed:", error.message);
}
```

## Rate Limits

Rate limits depend on your API key tier:

- **Free tier**: 100 requests per minute
- **Paid tier**: 1000 requests per minute

## TypeScript Support

This SDK is written in TypeScript and includes full type definitions.

## License

MIT
