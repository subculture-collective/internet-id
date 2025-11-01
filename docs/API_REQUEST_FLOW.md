# API Request Flow Documentation

Detailed documentation of HTTP request flows, middleware chain, and data transformations in the Internet-ID API server.

## Table of Contents

- [Request Lifecycle](#request-lifecycle)
- [Middleware Chain](#middleware-chain)
- [Registration Flow](#registration-flow)
- [Verification Flow](#verification-flow)
- [Platform Binding Flow](#platform-binding-flow)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Caching Strategy](#caching-strategy)

## Request Lifecycle

Overview of how HTTP requests flow through the API server.

```
┌────────────────┐
│  HTTP Request  │
└───────┬────────┘
        │
        ▼
┌────────────────────────────────────────────────┐
│           Middleware Chain                     │
│  ┌──────────────────────────────────────────┐ │
│  │ 1. Correlation ID (every request)        │ │
│  │ 2. Structured Logger (pino)              │ │
│  │ 3. Request Logger (method, path, IP)     │ │
│  │ 4. CORS (cross-origin headers)           │ │
│  │ 5. Security Headers (Helmet)             │ │
│  │ 6. Body Parser (JSON, multipart)         │ │
│  │ 7. Rate Limiter (per-IP/per-key)         │ │
│  │ 8. API Key Auth (protected routes)       │ │
│  └──────────────────────────────────────────┘ │
└───────┬────────────────────────────────────────┘
        │
        ▼
┌──────────────────┐
│  Route Handler   │
│  ┌────────────┐  │
│  │ Validate   │  │ ← Zod schema validation
│  │ Input      │  │
│  └─────┬──────┘  │
│        │         │
│  ┌─────▼──────┐  │
│  │ Business   │  │ ← Service layer logic
│  │ Logic      │  │
│  └─────┬──────┘  │
│        │         │
│  ┌─────▼──────┐  │
│  │ Database   │  │ ← Prisma queries
│  │ / IPFS /   │  │   IPFS uploads
│  │ Blockchain │  │   Contract calls
│  └─────┬──────┘  │
│        │         │
│  ┌─────▼──────┐  │
│  │ Response   │  │ ← Format JSON
│  │ Formatter  │  │
│  └────────────┘  │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ Response Logger  │ ← Log status, duration
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│  HTTP Response   │
└──────────────────┘
```

## Middleware Chain

### 1. Correlation ID Middleware

**Purpose**: Assign unique ID to each request for log tracing.

**Implementation**:

```typescript
import { v4 as uuidv4 } from "uuid";

app.use((req, res, next) => {
  req.correlationId = uuidv4();
  res.setHeader("X-Correlation-ID", req.correlationId);
  next();
});
```

**Headers**:

- `X-Correlation-ID`: Returned in response for client-side tracking

**Use Case**: Trace request across logs, services, and errors.

---

### 2. Structured Logger Middleware

**Purpose**: Attach request-scoped logger with context.

**Implementation**:

```typescript
import logger from "./logger";

app.use((req, res, next) => {
  req.log = logger.child({
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});
```

**Usage in handlers**:

```typescript
req.log.info({ contentHash }, "Registering content");
req.log.error({ err }, "Registration failed");
```

---

### 3. Request Logger Middleware

**Purpose**: Log incoming requests with timing.

**Implementation**:

```typescript
app.use((req, res, next) => {
  const start = Date.now();

  req.log.info("Request started");

  res.on("finish", () => {
    const duration = Date.now() - start;
    req.log.info(
      {
        statusCode: res.statusCode,
        duration,
      },
      "Request completed"
    );
  });

  next();
});
```

**Log Output**:

```json
{
  "level": "info",
  "correlationId": "abc-123",
  "method": "POST",
  "path": "/api/register",
  "statusCode": 200,
  "duration": 1234,
  "msg": "Request completed"
}
```

---

### 4. CORS Middleware

**Purpose**: Allow cross-origin requests from web app.

**Implementation**:

```typescript
import cors from "cors";

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  })
);
```

**Headers Set**:

- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`
- `Access-Control-Allow-Credentials`

---

### 5. Security Headers Middleware (Helmet)

**Purpose**: Set security-related HTTP headers.

**Implementation**:

```typescript
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

**Headers Set**:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy: ...`

---

### 6. Body Parser Middleware

**Purpose**: Parse request body (JSON, multipart/form-data).

**Implementation**:

```typescript
import express from "express";
import multer from "multer";

// JSON body parser
app.use(express.json({ limit: "10mb" }));

// URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Multipart form data (file uploads)
const upload = multer({
  dest: "/tmp/uploads",
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedMimes = ["video/mp4", "image/jpeg", "image/png" /* ... */];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

app.post("/api/upload", upload.single("file"), uploadHandler);
```

---

### 7. Rate Limiter Middleware

**Purpose**: Prevent abuse with per-IP rate limits.

**Implementation**:

```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: "rate-limit:strict:",
  }),
});

const moderateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 requests per minute
  store: new RedisStore({
    client: redis,
    prefix: "rate-limit:moderate:",
  }),
});

// Apply to routes
app.post("/api/register", strictLimiter, registerHandler);
app.post("/api/verify", moderateLimiter, verifyHandler);
```

**Response Headers**:

- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 95`
- `X-RateLimit-Reset: 1704556800`

**When Exceeded**:

- Status: `429 Too Many Requests`
- Body: `{ error: "Too many requests, please try again later." }`

See: [Rate Limiting Documentation](./RATE_LIMITING.md)

---

### 8. API Key Auth Middleware (Protected Routes)

**Purpose**: Require API key for sensitive operations.

**Implementation**:

```typescript
function requireApiKey(req: Request, res: Response, next: NextFunction) {
  if (!process.env.API_KEY) {
    // No API key configured, allow request
    return next();
  }

  const providedKey = req.headers["x-api-key"];

  if (!providedKey || providedKey !== process.env.API_KEY) {
    req.log.warn("Invalid or missing API key");
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }

  next();
}

// Apply to protected routes
app.post("/api/upload", requireApiKey, uploadHandler);
app.post("/api/register", requireApiKey, registerHandler);
```

**Header Required**:

```
x-api-key: your-api-key-here
```

---

## Registration Flow

Complete flow for registering content on-chain.

### Request

```http
POST /api/register HTTP/1.1
Host: localhost:3001
Content-Type: multipart/form-data
x-api-key: supersecret

--boundary
Content-Disposition: form-data; name="file"
Content-Type: video/mp4

[binary video data]
--boundary
Content-Disposition: form-data; name="manifestUri"

ipfs://QmXyz789...
--boundary
Content-Disposition: form-data; name="registryAddress"

0x5FbDB2315678afecb367f032d93F642f64180aa3
--boundary--
```

### Flow Diagram

```
┌────────┐
│ Client │
└───┬────┘
    │ POST /api/register
    │ (file, manifestUri, registryAddress)
    ▼
┌───────────────────────────────────────────┐
│ Middleware Chain                          │
│ • Correlation ID                          │
│ • Logger                                  │
│ • CORS                                    │
│ • Security Headers                        │
│ • Body Parser (multipart)                 │
│ • Rate Limiter (10 req/min)               │
│ • API Key Auth                            │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ Route Handler: registerHandler            │
│                                           │
│ 1. Validate Input (Zod)                  │
│    ├─ file exists and valid              │
│    ├─ manifestUri is valid IPFS URI      │
│    └─ registryAddress is valid Ethereum  │
│                                           │
│ 2. Compute Content Hash                  │
│    └─ SHA-256 hash of file bytes         │
│                                           │
│ 3. Check Cache (if Redis enabled)        │
│    └─ Already registered? Return cached  │
│                                           │
│ 4. Register on Blockchain                │
│    ├─ Load private key from env          │
│    ├─ Create ethers.js signer            │
│    ├─ Load ContentRegistry contract      │
│    ├─ Call register(hash, manifestUri)   │
│    ├─ Wait for transaction confirmation  │
│    └─ Get transaction receipt            │
│                                           │
│ 5. Store in Database (Prisma)            │
│    └─ Content.create({                   │
│         contentHash,                      │
│         manifestUri,                      │
│         creatorAddress,                   │
│         txHash,                           │
│         chainId                           │
│       })                                  │
│                                           │
│ 6. Invalidate Cache (if Redis enabled)   │
│    └─ Clear content list cache           │
│                                           │
│ 7. Return Response                        │
│    └─ { success: true,                   │
│         contentHash,                      │
│         txHash,                           │
│         blockNumber }                     │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ Response Logger                           │
│ • Log success/failure                     │
│ • Log duration                            │
│ • Log status code                         │
└───────────────┬───────────────────────────┘
                │
                ▼
┌────────┐
│ Client │ ← 200 OK { success: true, ... }
└────────┘
```

### Code Example

```typescript
async function registerHandler(req: Request, res: Response) {
  const log = req.log;

  try {
    // 1. Validate input
    const schema = z.object({
      manifestUri: z.string().startsWith("ipfs://"),
      registryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    });

    const { manifestUri, registryAddress } = schema.parse(req.body);
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    log.info({ manifestUri, registryAddress }, "Starting registration");

    // 2. Compute content hash
    const contentHash = await computeHash(file.path);
    log.debug({ contentHash }, "Content hash computed");

    // 3. Check cache
    if (cache) {
      const cached = await cache.get(`content:${contentHash}`);
      if (cached) {
        log.info("Content already registered (cached)");
        return res.json({ success: true, cached: true, ...cached });
      }
    }

    // 4. Register on blockchain
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const registry = new ethers.Contract(registryAddress, ABI, signer);

    log.info("Sending transaction to blockchain");
    const tx = await registry.register(contentHash, manifestUri);
    log.info({ txHash: tx.hash }, "Transaction sent, waiting for confirmation");

    const receipt = await tx.wait();
    log.info(
      {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      },
      "Transaction confirmed"
    );

    // 5. Store in database
    await prisma.content.create({
      data: {
        contentHash,
        manifestUri,
        creatorAddress: await signer.getAddress(),
        txHash: receipt.hash,
        chainId: (await provider.getNetwork()).chainId,
      },
    });

    log.info("Content stored in database");

    // 6. Invalidate cache
    if (cache) {
      await cache.del("contents:list");
      await cache.set(
        `content:${contentHash}`,
        {
          contentHash,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
        },
        600
      ); // 10min TTL
    }

    // 7. Return response
    res.json({
      success: true,
      contentHash,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    log.error({ err: error }, "Registration failed");

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }

    res.status(500).json({ error: "Registration failed" });
  }
}
```

---

## Verification Flow

Flow for verifying content against manifest and on-chain registry.

### Request

```http
POST /api/verify HTTP/1.1
Host: localhost:3001
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"
Content-Type: video/mp4

[binary video data]
--boundary
Content-Disposition: form-data; name="manifestUri"

ipfs://QmXyz789...
--boundary--
```

### Flow Diagram

```
Client → Middleware → Handler
                       ├─ 1. Validate Input
                       ├─ 2. Compute File Hash
                       ├─ 3. Fetch Manifest from IPFS
                       ├─ 4. Verify Signature
                       ├─ 5. Check On-Chain Entry
                       ├─ 6. Store Verification Record
                       └─ 7. Return Result
```

### Verification Steps

1. **Compute file hash**: SHA-256 of uploaded file
2. **Fetch manifest**: Download from IPFS using manifestUri
3. **Parse manifest**: Extract content_hash, signature, creator
4. **Verify hash match**: Compare computed hash with manifest.content_hash
5. **Verify signature**: `ecrecover(signature) == manifest.creator`
6. **Check on-chain**: Look up `ContentRegistry.entries[hash]`
7. **Verify on-chain data**: Match creator, manifestUri
8. **Store verification**: Record attempt in database
9. **Return result**: `{ verified: true/false, details: {...} }`

### Response

```json
{
  "verified": true,
  "details": {
    "contentHash": "0xabc123...",
    "creator": "0x1234567890...",
    "manifestUri": "ipfs://QmXyz789...",
    "timestamp": 1704556800,
    "txHash": "0xdef456...",
    "blockNumber": 12345678
  }
}
```

---

## Platform Binding Flow

Flow for binding platform-specific content to original.

### Request

```http
POST /api/bind HTTP/1.1
Host: localhost:3001
Content-Type: application/json
x-api-key: supersecret

{
  "contentHash": "0xabc123...",
  "platform": "youtube",
  "platformId": "dQw4w9WgXcQ",
  "registryAddress": "0x5FbDB2..."
}
```

### Flow

1. **Validate input**: Zod schema validation
2. **Check content exists**: Query database for contentHash
3. **Check binding exists**: Query PlatformBinding table
4. **Bind on-chain**: Call `ContentRegistry.bindPlatform(hash, platform, platformId)`
5. **Store in database**: Create PlatformBinding record
6. **Invalidate cache**: Clear platform binding cache
7. **Return success**: `{ success: true, ... }`

### Response

```json
{
  "success": true,
  "platform": "youtube",
  "platformId": "dQw4w9WgXcQ",
  "contentHash": "0xabc123...",
  "txHash": "0xghi789..."
}
```

---

## Error Handling

### Error Response Format

All errors follow consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    /* optional additional context */
  },
  "correlationId": "abc-123"
}
```

### HTTP Status Codes

- `200 OK`: Successful operation
- `400 Bad Request`: Invalid input (validation failed)
- `401 Unauthorized`: Missing/invalid API key
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error

### Error Handling Middleware

```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  req.log.error({ err, correlationId: req.correlationId }, "Unhandled error");

  // Send to Sentry (if configured)
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: { correlationId: req.correlationId },
    });
  }

  res.status(500).json({
    error: "Internal server error",
    correlationId: req.correlationId,
  });
});
```

---

## Rate Limiting

### Tiered Rate Limits

**Strict** (sensitive operations):

- 10 requests per minute per IP
- Applied to: `/api/register`, `/api/bind`

**Moderate** (public operations):

- 100 requests per minute per IP
- Applied to: `/api/verify`, `/api/upload`

**Relaxed** (read-only):

- 300 requests per minute per IP
- Applied to: `/api/health`, `/api/contents`

### Rate Limit Headers

Every rate-limited response includes:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704556800
```

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704556800

{
  "error": "Too many requests, please try again later.",
  "retryAfter": 60
}
```

See: [Rate Limiting Documentation](./RATE_LIMITING.md)

---

## Caching Strategy

### Cache Layers

1. **Redis Cache** (if enabled):
   - Content metadata
   - Platform bindings
   - Manifest data
   - Verification results

2. **In-Memory Cache** (fallback):
   - Simple Map-based cache
   - LRU eviction
   - No persistence

### Cache Keys

- `content:{hash}` - Content metadata (10min TTL)
- `manifest:{uri}` - Manifest JSON (15min TTL)
- `binding:{platform}:{id}` - Platform binding (3min TTL)
- `verification:{hash}` - Verification status (5min TTL)
- `contents:list` - Content list (5min TTL)

### Cache Invalidation

**On write operations**:

- Registration: Invalidate `contents:list`
- Binding: Invalidate `binding:*` for platform
- Update: Invalidate specific `content:{hash}`

**TTL-based expiration**:

- Short TTL for frequently changing data
- Longer TTL for immutable data

### Cache Flow

```typescript
async function getContent(hash: string) {
  // 1. Check cache
  const cached = await cache.get(`content:${hash}`);
  if (cached) {
    return cached;
  }

  // 2. Query database
  const content = await prisma.content.findUnique({
    where: { contentHash: hash },
  });

  if (!content) {
    return null;
  }

  // 3. Store in cache
  await cache.set(`content:${hash}`, content, 600); // 10min

  return content;
}
```

See: [Caching Architecture](./CACHING_ARCHITECTURE.md)

---

## Additional Resources

- [Input Validation Documentation](./VALIDATION.md)
- [Rate Limiting Documentation](./RATE_LIMITING.md)
- [Caching Architecture](./CACHING_ARCHITECTURE.md)
- [Security Policy](../SECURITY_POLICY.md)
- [API Reference](./PUBLIC_API.md)
