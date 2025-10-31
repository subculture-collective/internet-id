# Internet ID Public API Documentation

## Overview

The Internet ID Public API enables third-party developers to build integrations, tools, and services on top of Internet ID's content provenance platform.

## Base URLs

- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://api.internet-id.io/api/v1` _(placeholder)_

## Authentication

The API supports two authentication methods:

### 1. API Keys

API keys are recommended for server-side integrations. Include your API key in the `x-api-key` header:

```bash
curl -H "x-api-key: iid_your_api_key_here" \
  https://api.internet-id.io/api/v1/content
```

### 2. JWT Tokens

JWT tokens are recommended for user-scoped access. Include the token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer your_jwt_token_here" \
  https://api.internet-id.io/api/v1/api-keys
```

## Rate Limits

Rate limits vary by tier:

| Tier | Requests per Minute |
|------|---------------------|
| Free | 100                 |
| Paid | 1000                |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## API Versioning

The API uses URL path versioning. The current version is `v1`, accessible at `/api/v1/`.

We follow semantic versioning principles:
- **Minor updates** (new features, backward-compatible): No version change required
- **Major updates** (breaking changes): New version path (e.g., `/api/v2/`)

## API Reference

### Interactive Documentation

Visit `/api/docs` for interactive Swagger UI documentation:
- **Development**: http://localhost:3001/api/docs
- **OpenAPI JSON**: http://localhost:3001/api/docs.json

### Verification Endpoints

#### Verify by Platform

Verify content authenticity using platform-specific identifiers.

```
GET /api/v1/verify/platform
```

**Query Parameters:**
- `url` (string, optional): Full platform URL (e.g., `https://youtube.com/watch?v=xyz`)
- `platform` (string, optional): Platform name (`youtube`, `tiktok`, `instagram`, etc.)
- `platformId` (string, optional): Platform-specific content ID

**Note:** Provide either `url` OR both `platform` and `platformId`.

**Example Request:**

```bash
curl "https://api.internet-id.io/api/v1/verify/platform?url=https://youtube.com/watch?v=abc123"
```

**Example Response:**

```json
{
  "verified": true,
  "platform": "youtube",
  "platformId": "abc123",
  "creator": "0x1234567890abcdef",
  "contentHash": "0xabcd...",
  "manifestURI": "ipfs://QmXyz...",
  "timestamp": 1698765432,
  "registryAddress": "0x9876543210fedcba",
  "chainId": 8453,
  "manifest": {
    "content_hash": "0xabcd...",
    "creator": "0x1234567890abcdef",
    "signature": "0x...",
    "timestamp": "2024-10-31T12:00:00Z"
  }
}
```

#### Verify by Hash

Verify content by its content hash.

```
GET /api/v1/verify/hash/:hash
```

**Path Parameters:**
- `hash` (string, required): Content hash (32-byte hex string with 0x prefix)

**Example Request:**

```bash
curl "https://api.internet-id.io/api/v1/verify/hash/0xabcd1234..."
```

### Content Metadata Endpoints

#### List Content

List registered content with pagination.

```
GET /api/v1/content
```

**Query Parameters:**
- `limit` (number, optional): Items per page (max 100, default 20)
- `offset` (number, optional): Pagination offset (default 0)
- `creator` (string, optional): Filter by creator address

**Example Request:**

```bash
curl "https://api.internet-id.io/api/v1/content?limit=10&offset=0"
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "clx123abc",
      "contentHash": "0xabcd...",
      "manifestUri": "ipfs://QmXyz...",
      "creatorAddress": "0x1234567890abcdef",
      "registryAddress": "0x9876543210fedcba",
      "txHash": "0xdef...",
      "createdAt": "2024-10-31T12:00:00Z",
      "bindings": [
        {
          "platform": "youtube",
          "platformId": "abc123"
        }
      ]
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 42,
    "hasMore": true
  }
}
```

#### Get Content by ID

Get specific content by database ID.

```
GET /api/v1/content/:id
```

#### Get Content by Hash

Get content by content hash.

```
GET /api/v1/content/hash/:hash
```

### API Key Management

**Authentication required**: These endpoints require JWT token authentication.

#### Create API Key

Create a new API key.

```
POST /api/v1/api-keys
```

**Request Body:**

```json
{
  "name": "My Application Key",
  "tier": "free",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response:**

```json
{
  "message": "API key created successfully",
  "data": {
    "id": "clx456def",
    "key": "iid_abc123...",
    "name": "My Application Key",
    "tier": "free",
    "rateLimit": 100,
    "createdAt": "2024-10-31T12:00:00Z"
  },
  "warning": "Save this key securely. It won't be shown again."
}
```

⚠️ **Important**: Save the API key immediately. It cannot be retrieved later.

#### List API Keys

List all your API keys.

```
GET /api/v1/api-keys
```

**Response:**

```json
{
  "data": [
    {
      "id": "clx456def",
      "name": "My Application Key",
      "tier": "free",
      "rateLimit": 100,
      "isActive": true,
      "lastUsedAt": "2024-10-31T12:30:00Z",
      "expiresAt": null,
      "createdAt": "2024-10-31T12:00:00Z"
    }
  ]
}
```

#### Revoke API Key

Revoke (deactivate) an API key.

```
PATCH /api/v1/api-keys/:id/revoke
```

#### Delete API Key

Permanently delete an API key.

```
DELETE /api/v1/api-keys/:id
```

### Authentication Endpoints

#### Generate JWT Token

Generate a JWT token by signing a message with your wallet.

```
POST /api/v1/auth/token
```

**Request Body:**

```json
{
  "address": "0x1234567890abcdef",
  "signature": "0xabc...",
  "message": "Sign in to Internet ID API"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "user": {
    "id": "clx789ghi",
    "address": "0x1234567890abcdef",
    "email": null
  }
}
```

## TypeScript/JavaScript SDK

For easier integration, use the official SDK:

```bash
npm install @internet-id/sdk
```

```typescript
import { InternetIdClient } from '@internet-id/sdk';

const client = new InternetIdClient({
  apiKey: 'iid_your_api_key_here'
});

// Verify content
const result = await client.verifyByPlatform({
  url: 'https://youtube.com/watch?v=abc123'
});

console.log(result.verified); // true or false
```

See [SDK Documentation](../sdk/typescript/README.md) for detailed usage.

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error type or summary",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or invalid credentials
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Changelog

### Version 1.0.0 (2024-10-31)

- Initial release
- Verification endpoints (by platform and hash)
- Content metadata endpoints
- API key management
- JWT authentication
- TypeScript/JavaScript SDK

## Deprecation Policy

When we need to introduce breaking changes, we will:

1. **Announce** the deprecation at least 3 months in advance
2. **Maintain** the deprecated version for at least 6 months
3. **Provide** migration guides and updated SDKs
4. **Support** both old and new versions during the transition period

Deprecated endpoints will include warnings in response headers:
```
Deprecation: true
Sunset: Sat, 31 Oct 2025 23:59:59 GMT
Link: <https://docs.internet-id.io/api/migration>; rel="sunset"
```

## Support

- **Documentation**: https://docs.internet-id.io
- **GitHub Issues**: https://github.com/subculture-collective/internet-id/issues
- **Email**: api-support@internet-id.io _(placeholder)_

## License

The API is available under the MIT License. See [LICENSE](../LICENSE) for details.
