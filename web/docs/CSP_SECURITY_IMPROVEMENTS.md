# Content Security Policy Security Improvements

## Overview
This document describes the security improvements made to the Content Security Policy (CSP) implementation in the Internet-ID web application.

## Changes Made

### 1. Removed `unsafe-eval` from Production
**Before:** `script-src 'self' 'unsafe-eval' 'unsafe-inline'`  
**After (Production):** `script-src 'self' 'nonce-{random}' https://www.googletagmanager.com`  
**After (Development):** `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com`

- **Impact:** Prevents execution of `eval()`, `new Function()`, and similar dynamic code evaluation
- **XSS Protection:** Eliminates a common XSS attack vector
- **Development:** Kept `unsafe-eval` in development mode for Hot Module Replacement (HMR) support

### 2. Replaced `unsafe-inline` with Nonce-Based Approach
**Implementation:**
- Dynamic nonce generation in middleware for each request
- Nonces are cryptographically random (base64-encoded UUID)
- Next.js Script components automatically receive nonces
- JSON-LD structured data scripts don't require nonces (type="application/ld+json")

**Benefits:**
- Only scripts with the correct nonce can execute
- Inline event handlers are blocked
- XSS attacks via inline scripts are prevented

### 3. Enhanced Domain Restrictions
**Added to `img-src`:**
- `https://www.googletagmanager.com` (Google Analytics)

**Added to `connect-src`:**
- `https://www.google-analytics.com` (Google Analytics API)
- `https://stats.g.doubleclick.net` (Google Analytics)

**Existing Restrictions Maintained:**
- Multiple blockchain RPC endpoints (Infura, Alchemy, QuickNode, etc.)
- IPFS gateways (ipfs.io, Pinata, Cloudflare)
- Base, Arbitrum, Optimism, Polygon networks

### 4. Maintained Existing Security Measures
The following CSP directives were already properly configured and remain unchanged:
- `frame-ancestors 'self'` - Prevents clickjacking
- `object-src 'none'` - Blocks plugins
- `base-uri 'self'` - Prevents base tag injection
- `form-action 'self'` - Restricts form submissions
- `upgrade-insecure-requests` - Forces HTTPS

## Technical Implementation

### Middleware-Based CSP
File: `web/middleware.ts`

The CSP is now dynamically generated in middleware to support per-request nonces:

```typescript
function buildCSP(nonce?: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com"
    : nonce
    ? `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com`
    : "script-src 'self' https://www.googletagmanager.com";
  
  // ... other directives
}
```

### Nonce Generation
```typescript
// Generate unique nonce per request in production
if (!isDev) {
  nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  requestHeaders.set('x-nonce', nonce);
}
```

### Component Integration
File: `web/app/components/GoogleAnalytics.tsx`

Updated to accept and use nonces:
```typescript
export default function GoogleAnalytics({ nonce }: GoogleAnalyticsProps) {
  // ...
  <Script id="google-analytics" strategy="afterInteractive" nonce={nonce}>
    {/* inline script */}
  </Script>
}
```

### Layout Integration
File: `web/app/layout.tsx`

Root layout passes nonce to components:
```typescript
const nonce = await getNonce();
// ...
<GoogleAnalytics nonce={nonce} />
```

## Security Benefits

### XSS Protection
1. **Inline Script Blocking:** Only scripts with valid nonces execute
2. **No eval():** Dynamic code evaluation is blocked in production
3. **Event Handler Protection:** Inline event handlers (onclick, etc.) are blocked
4. **Third-Party Scripts:** Only whitelisted domains can load scripts

### Defense in Depth
- CSP complements other security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Multiple layers of protection against various attack vectors
- Granular control over resource loading

### Compliance
- Aligns with OWASP security best practices
- Meets modern web security standards
- Demonstrates security-conscious development

## Testing

### Production Mode
```bash
curl -I http://localhost:3000/badges | grep content-security-policy
# Output: script-src 'self' 'nonce-{unique-per-request}' https://www.googletagmanager.com
```

### Development Mode
```bash
NODE_ENV=development npm run dev
curl -I http://localhost:3000/badges | grep content-security-policy
# Output: script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com
```

### Nonce Uniqueness
Each request generates a unique nonce:
- Request 1: `nonce-N2ZlYjY4YWMtMjc3YS00YjkyLWFmMDEtMjZhMWM3ZDM4MWQ5`
- Request 2: `nonce-YzYwYjBkYmUtMjkyNC00YmY2LWE4YjMtMjUyMjc2NDgxMDEz`

## Monitoring and Debugging

### CSP Violation Reports (Future Enhancement)
To enable CSP violation reporting, add:
```typescript
"report-uri /api/csp-report",
"report-to csp-endpoint"
```

### Browser DevTools
- Check Console for CSP violations
- Review Network tab for blocked resources
- Use Security tab to inspect CSP policy

### Common Issues
1. **Third-party scripts failing:** Add domains to script-src
2. **Inline styles blocked:** Already allowing 'unsafe-inline' for styles
3. **Dynamic imports:** Should work with nonces in Next.js

## Migration Notes

### For Developers
- Inline scripts must use Next.js `<Script>` component
- Event handlers should use React event props, not inline attributes
- Dynamic script loading should use approved methods

### For Third-Party Integrations
- Verify scripts work with CSP nonces
- Test in development first
- Document any CSP adjustments needed

## References
- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
