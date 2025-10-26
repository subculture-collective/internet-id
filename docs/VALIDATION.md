# API Input Validation & Sanitization

This document describes the comprehensive input validation and sanitization implemented across all API endpoints to prevent injection attacks, malformed data, and security vulnerabilities.

## Overview

All API endpoints validate and sanitize user inputs using:

- **Zod** for schema validation
- **validator.js** for string sanitization
- Custom middleware for file validation
- Consistent error responses with detailed validation messages

## Validation Architecture

### Validation Middleware

Three middleware functions handle different types of input:

1. **`validateBody(schema)`** - Validates request body against a Zod schema
2. **`validateQuery(schema)`** - Validates query parameters against a Zod schema
3. **`validateParams(schema)`** - Validates URL parameters against a Zod schema
4. **`validateFile(options)`** - Validates uploaded files (size, MIME type, filename)

### Error Response Format

All validation errors return **400 Bad Request** with a consistent JSON structure:

```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "registryAddress",
      "message": "Invalid Ethereum address format"
    }
  ]
}
```

## Validation Rules by Field Type

### Ethereum Addresses

**Pattern**: `0x` followed by 40 hexadecimal characters

**Example**: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e`

**Rejects**:

- Missing `0x` prefix
- Wrong length (not 42 characters total)
- Non-hexadecimal characters
- SQL injection attempts

### Content Hashes

**Pattern**: `0x` followed by 64 hexadecimal characters (SHA-256)

**Example**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

**Rejects**:

- Missing `0x` prefix
- Wrong length (not 66 characters total)
- Non-hexadecimal characters

### URIs

#### IPFS URIs

**Pattern**: `ipfs://` followed by base58-encoded CID (Content Identifier)

**Example**: `ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`

**Note**: IPFS CIDs use base58 encoding which includes characters 1-9, a-z, A-Z (excluding 0, O, I, l to avoid confusion)

**Rejects**:

- Invalid IPFS protocol
- Path traversal attempts (`../`)
- Invalid characters in CID

#### HTTP/HTTPS URIs

**Pattern**: Valid HTTP or HTTPS URL

**Example**: `https://example.com/manifest.json`

**Rejects**:

- Malformed URLs
- Dangerous protocols (`javascript:`, `data:`, `file:`, etc.)
- Non-HTTP(S) protocols

### Platform Identifiers

#### Platform Name

**Pattern**: Lowercase alphanumeric with hyphens and underscores

**Length**: 1-50 characters

**Example**: `youtube`, `tik-tok`, `social_media`

**Rejects**:

- Uppercase letters
- Spaces
- Special characters
- Empty strings
- Names exceeding 50 characters

#### Platform ID

**Pattern**: Alphanumeric with slashes, hyphens, underscores, colons, dots, and @ symbols

**Length**: 1-500 characters

**Example**: `dQw4w9WgXcQ`, `user/status/123456789`, `user@domain:123`

**Rejects**:

- Control characters
- Null bytes
- IDs exceeding 500 characters
- Empty strings

### File Uploads

#### Allowed MIME Types

- **Images**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
- **Video**: `video/mp4`, `video/webm`, `video/quicktime`, `video/x-msvideo`
- **Audio**: `audio/mpeg`, `audio/wav`, `audio/ogg`
- **Documents**: `application/pdf`, `text/plain`, `application/json`

#### Size Limits

**Maximum file size**: 1GB (1024 MB)

#### Filename Validation

**Rejects**:

- Path traversal attempts (`../`, `./`, `\`)
- Null bytes (`\0`)
- Files exceeding 255 characters
- Dangerous characters (`<`, `>`, `:`, `"`, `|`, `?`, `*`)

### User Data

#### Email Addresses

**Pattern**: Valid email format per RFC 5322

**Example**: `user@example.com`

**Features**:

- Normalizes email addresses (lowercase, removes dots in Gmail addresses)
- Validates format
- Maximum 255 characters

**Rejects**:

- Invalid email format
- Missing @ symbol
- Invalid domain

#### Names

**Pattern**: Alphanumeric with spaces, hyphens, underscores, and dots

**Length**: 1-100 characters

**Example**: `John Doe`, `Jane-Smith`, `User_123`

**Rejects**:

- HTML/script tags
- Special characters
- Names exceeding 100 characters

## Validation by Endpoint

### POST /api/upload

**Protected**: Yes (requires API key)

**Validation**:

- File is required
- File size ≤ 1GB
- MIME type in allowed list
- Filename without path traversal

**Schema**: File validation only

### POST /api/manifest

**Protected**: Yes (requires API key)

**Body Parameters**:

- `contentUri` (required): IPFS or HTTP(S) URI (1-1000 chars)
- `upload` (optional): "true" or "false"
- `contentHash` (optional): 0x + 64 hex chars

**File**: Optional, validated if present

### POST /api/register

**Protected**: Yes (requires API key)

**Body Parameters**:

- `registryAddress` (required): Valid Ethereum address
- `manifestURI` (required): IPFS or HTTP(S) URI
- `contentHash` (optional): 0x + 64 hex chars

**File**: Optional, validated if present

### POST /api/bind

**Protected**: Yes (requires API key)

**Body Parameters**:

- `registryAddress` (required): Valid Ethereum address
- `platform` (required): Lowercase platform name (1-50 chars)
- `platformId` (required): Platform-specific ID (1-500 chars)
- `contentHash` (required): 0x + 64 hex chars

### POST /api/bind-many

**Protected**: Yes (requires API key)

**Body Parameters**:

- `registryAddress` (required): Valid Ethereum address
- `contentHash` (required): 0x + 64 hex chars
- `bindings` (required): Array of 1-50 binding objects

**Binding Object**:

```json
{
  "platform": "youtube",
  "platformId": "dQw4w9WgXcQ"
}
```

### POST /api/verify

**Protected**: No

**Body Parameters**:

- `registryAddress` (required): Valid Ethereum address
- `manifestURI` (required): IPFS or HTTP(S) URI
- `rpcUrl` (optional): HTTP(S) URL

**File**: Required, validated

### POST /api/proof

**Protected**: No

**Body Parameters**:

- `registryAddress` (required): Valid Ethereum address
- `manifestURI` (required): IPFS or HTTP(S) URI
- `rpcUrl` (optional): HTTP(S) URL

**File**: Required, validated

### POST /api/one-shot

**Protected**: Yes (requires API key)

**Body Parameters**:

- `registryAddress` (required): Valid Ethereum address
- `platform` (optional): Lowercase platform name
- `platformId` (optional): Platform-specific ID
- `uploadContent` (optional): "true" or "false"
- `bindings` (optional): Array of binding objects or JSON string

**File**: Required, validated

### GET /api/resolve

**Protected**: No

**Query Parameters**:

- `url` (optional): Full platform URL (max 2000 chars)
- `platform` (optional): Platform name
- `platformId` (optional): Platform ID

**Constraints**: Must provide either `url` OR both `platform` and `platformId`

### GET /api/public-verify

**Protected**: No

**Query Parameters**: Same as `/api/resolve`

### GET /api/verifications

**Protected**: No

**Query Parameters**:

- `contentHash` (optional): 0x + 64 hex chars
- `limit` (optional): Number between 1 and 100

### GET /api/contents/:hash

**Protected**: No

**URL Parameters**:

- `hash` (required): 0x + 64 hex chars

### POST /api/users

**Protected**: No

**Body Parameters** (at least one required):

- `address` (optional): Valid Ethereum address
- `email` (optional): Valid email address (max 255 chars)
- `name` (optional): Alphanumeric name (1-100 chars)

## Sanitization Functions

### String Sanitization

**Function**: `sanitizeString(input: string)`

**Purpose**: Prevent XSS attacks

**Action**: Escapes HTML entities (`<`, `>`, `&`, `"`, `'`)

**Example**:

```typescript
sanitizeString("<script>alert('xss')</script>");
// Returns: "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
```

### URL Sanitization

**Function**: `sanitizeUrl(url: string, options?)`

**Purpose**: Prevent malicious URLs

**Action**:

- Validates URL format
- Rejects dangerous protocols (`javascript:`, `data:`, `file:`)
- Trims whitespace
- Special handling for IPFS URIs

### Number Sanitization

**Function**: `sanitizeNumber(input, options?)`

**Purpose**: Ensure valid numeric input

**Options**:

- `min`: Minimum allowed value
- `max`: Maximum allowed value
- `integer`: Require integer (no decimals)

**Rejects**: NaN, Infinity, values outside bounds

## Security Features

### XSS Prevention

- All string inputs are escaped when necessary
- HTML/script tags in names and platform identifiers are rejected
- File upload content types are strictly validated

### SQL Injection Prevention

- All database queries use Prisma ORM with parameterized queries
- Input validation rejects SQL special characters in inappropriate contexts

### Command Injection Prevention

- Filename validation prevents command injection via semicolons and pipes
- No user input is passed to shell commands

### Path Traversal Prevention

- Filenames are validated to reject `../`, `./`, and `\` characters
- IPFS URIs are validated to prevent path traversal
- All file operations use safe path joining

### DoS Prevention

- File size limits (1GB max)
- JSON size limits (1MB max)
- Binding array limits (50 max)
- String length limits on all fields

## Testing

### Test Coverage

- **129 unit tests** covering validation and sanitization
- Edge cases: empty strings, oversized inputs, malicious payloads
- Security tests: XSS, SQL injection, path traversal, command injection

### Running Tests

```bash
npm test
```

### Test Files

- `test/validation/schemas.test.ts` - Zod schema validation tests
- `test/validation/sanitization.test.ts` - Sanitization utility tests

## Best Practices

1. **Always validate before processing**: Validation middleware runs before route handlers
2. **Fail fast**: Invalid requests are rejected immediately with 400 status
3. **Clear error messages**: Users receive specific feedback about what's wrong
4. **Defense in depth**: Multiple layers of validation (schemas, sanitization, file checks)
5. **Consistent format**: All validation errors follow the same JSON structure

## Future Enhancements

- [ ] Rate limiting per IP/API key
- [ ] CAPTCHA for public endpoints
- [ ] Content scanning for malicious files
- [ ] IP blocklists for known bad actors
- [ ] Audit logging for failed validation attempts
