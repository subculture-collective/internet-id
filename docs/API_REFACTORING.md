# API Refactoring Documentation

## Overview

This document describes the refactoring of the Express API from a monolithic 1133-line file into modular, testable components.

## Before and After

### Before
- **Single file**: `scripts/api.ts` (1133 lines)
- Mixed concerns: routing, business logic, database access, blockchain interactions
- Difficult to test individual components
- Hard to navigate and maintain

### After
- **16 focused modules** (1309 lines total, but organized)
- Clear separation of concerns
- Easy to test individual services and routes
- Improved maintainability and extensibility

## Architecture

```
scripts/
├── api.ts                     # Entry point (11 lines)
├── app.ts                     # Express app factory (30 lines)
├── middleware/
│   └── auth.middleware.ts     # API key authentication (13 lines)
├── services/                  # Business logic layer
│   ├── file.service.ts        # File operations (19 lines)
│   ├── hash.service.ts        # Hashing utilities (5 lines)
│   ├── manifest.service.ts    # Manifest fetching (34 lines)
│   ├── platform.service.ts    # Platform URL parsing (60 lines)
│   └── registry.service.ts    # Blockchain interactions (87 lines)
└── routes/                    # HTTP route handlers
    ├── binding.routes.ts      # Platform bindings (164 lines)
    ├── content.routes.ts      # Content queries (103 lines)
    ├── health.routes.ts       # Health/network/resolve (160 lines)
    ├── manifest.routes.ts     # Manifest creation (79 lines)
    ├── oneshot.routes.ts      # One-shot workflow (223 lines)
    ├── register.routes.ts     # On-chain registration (101 lines)
    ├── upload.routes.ts       # IPFS uploads (38 lines)
    └── verify.routes.ts       # Verification/proof (182 lines)
```

## Service Layer

### hash.service.ts
Provides cryptographic hashing utilities:
- `sha256Hex(buf: Buffer): string` - Computes SHA-256 hash with 0x prefix

### file.service.ts
Manages temporary file operations:
- `tmpWrite(originalName: string, buf: Buffer): Promise<string>` - Write buffer to temp file
- `cleanupTmpFile(tmpPath: string): Promise<void>` - Clean up temp file

### manifest.service.ts
Handles manifest fetching from various sources:
- `fetchHttpsJson(url: string): Promise<any>` - Fetch JSON over HTTPS
- `fetchManifest(uri: string): Promise<any>` - Fetch manifest from IPFS or HTTP

### platform.service.ts
Parses platform URLs into structured data:
- `parsePlatformInput(input?, platform?, platformId?): PlatformInfo | null`
- Supports: YouTube, TikTok, X/Twitter, Instagram, Vimeo, and generic URLs

### registry.service.ts
Encapsulates blockchain registry interactions:
- `resolveDefaultRegistry(): Promise<RegistryInfo>` - Get registry address for current network
- `getProvider(rpcUrl?): JsonRpcProvider` - Create Ethereum provider
- `resolveByPlatform(...)` - Resolve content by platform binding
- `getEntry(...)` - Get content entry by hash

## Router Layer

### health.routes.ts
- `GET /api/health` - Health check
- `GET /api/network` - Network info (chainId)
- `GET /api/registry` - Default registry address
- `GET /api/resolve` - Resolve binding by URL or platform+platformId
- `GET /api/public-verify` - Resolve + fetch manifest

### upload.routes.ts
- `POST /api/upload` - Upload file to IPFS (requires API key)

### manifest.routes.ts
- `POST /api/manifest` - Create and optionally upload manifest (requires API key)

### register.routes.ts
- `POST /api/register` - Register content on-chain (requires API key)

### verify.routes.ts
- `POST /api/verify` - Verify content against manifest
- `POST /api/proof` - Generate verification proof

### binding.routes.ts
- `POST /api/bind` - Bind single platform (requires API key)
- `POST /api/bind-many` - Bind multiple platforms (requires API key)

### content.routes.ts
- `POST /api/users` - Create user
- `GET /api/contents` - List all content
- `GET /api/contents/:hash` - Get content by hash
- `GET /api/verifications` - List verifications
- `GET /api/verifications/:id` - Get verification by ID
- `GET /api/contents/:hash/verifications` - Get verifications for content

### oneshot.routes.ts
- `POST /api/one-shot` - Upload, create manifest, register, and bind in one request (requires API key)

## Middleware

### auth.middleware.ts
Provides API key authentication:
- `requireApiKey(req, res, next)` - Validates API key from `x-api-key` or `authorization` header
- Checks against `API_KEY` environment variable

## Testing

### Unit Tests
Located in `test/services/services.test.ts`:
- Hash service tests (SHA-256 computation)
- Platform service tests (URL parsing for various platforms)

### Integration Tests
Located in `test/routes/routes.test.ts`:
- Route creation test

### Running Tests
```bash
npm test  # or: npx hardhat test
```

All tests pass (9 total):
- 1 existing ContentRegistry test
- 7 new service unit tests
- 1 new route integration test

## Usage

### Starting the API
```bash
npm run start:api  # or: ts-node scripts/api.ts
```

The API starts on port 3001 (or `PORT` env variable).

### Backward Compatibility
All existing endpoints are preserved with identical behavior. The refactoring is purely internal - no breaking changes to the API contract.

## Benefits

### 1. Testability
- Services can be unit tested in isolation
- No need to spin up the entire Express app for testing utilities
- Mocking dependencies is straightforward

### 2. Maintainability
- Each module has a single, clear responsibility
- Easy to locate and modify specific functionality
- Reduced cognitive load when working on a feature

### 3. Extensibility
- New routes can be added by creating a new router module
- New services can be added without touching existing code
- Clear patterns to follow for new features

### 4. Reusability
- Services can be imported and used by other scripts
- Utilities like `sha256Hex` and `parsePlatformInput` are now reusable
- No duplication of business logic

## Migration Guide

If you were importing the old `api.ts` file:

**Before:**
```typescript
// This wasn't really done, but if it was:
import { app } from './scripts/api';
```

**After:**
```typescript
import { createApp } from './scripts/app';
const app = createApp();
```

If you need individual utilities:
```typescript
import { sha256Hex } from './scripts/services/hash.service';
import { parsePlatformInput } from './scripts/services/platform.service';
```

## Security

See [SECURITY_SUMMARY.md](../SECURITY_SUMMARY.md) for CodeQL analysis results and security considerations.

## Future Improvements

1. **Rate Limiting**: Add rate limiting middleware for expensive operations
2. **Input Validation**: Add request validation middleware (e.g., using Zod or Joi)
3. **Error Handling**: Centralized error handling middleware
4. **Logging**: Structured logging with correlation IDs
5. **API Documentation**: OpenAPI/Swagger documentation
6. **Integration Tests**: Add more comprehensive integration tests with mocked dependencies
