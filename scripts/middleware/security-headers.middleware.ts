import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { randomBytes } from "crypto";

/**
 * Security Headers Middleware
 * 
 * Implements comprehensive security headers to protect against common web vulnerabilities:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME type sniffing
 * - Information leakage
 * 
 * CSP Configuration:
 * - Strict default-src policy
 * - Allows IPFS gateways for images
 * - Allows blockchain RPC endpoints
 * - Uses nonces for inline scripts
 */

/**
 * Generates a cryptographically secure random nonce for CSP
 */
export function generateNonce(): string {
  return Buffer.from(randomBytes(16)).toString("base64");
}

/**
 * CSP violation reporting endpoint handler
 */
export function cspReportHandler(req: Request, res: Response) {
  console.warn("[CSP Violation Report]", {
    timestamp: new Date().toISOString(),
    report: req.body,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  res.status(204).end();
}

/**
 * Configure helmet with comprehensive security headers
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        // Allow nonce-based inline scripts
        (_req: any, res: any) => `'nonce-${res.locals.cspNonce}'`,
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some frameworks, can be restricted further
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        // IPFS gateways
        "https://ipfs.io",
        "https://*.ipfs.io",
        "https://gateway.pinata.cloud",
        "https://*.mypinata.cloud",
        "https://cloudflare-ipfs.com",
        "https://dweb.link",
      ],
      connectSrc: [
        "'self'",
        // Blockchain RPC endpoints
        "https://*.infura.io",
        "https://*.alchemy.com",
        "https://*.quicknode.pro",
        "https://rpc.ankr.com",
        "https://cloudflare-eth.com",
        // Polygon
        "https://polygon-rpc.com",
        "https://rpc-mainnet.matic.network",
        "https://rpc-mainnet.maticvigil.com",
        // Base
        "https://mainnet.base.org",
        "https://base.llamarpc.com",
        // Arbitrum
        "https://arb1.arbitrum.io",
        "https://arbitrum.llamarpc.com",
        // Optimism
        "https://mainnet.optimism.io",
        "https://optimism.llamarpc.com",
        // IPFS
        "https://ipfs.io",
        "https://gateway.pinata.cloud",
      ],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      "frame-ancestors": ["'none'"], // Prevent embedding in iframes
      upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
    },
    reportOnly: false, // Set to true for testing, false to enforce
    // Note: reportUri is deprecated, use report-to instead
  },

  // Strict Transport Security (HSTS)
  // Forces HTTPS connections
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Content-Type-Options: nosniff
  // Prevents MIME type sniffing
  noSniff: true,

  // X-Frame-Options: DENY
  // Prevents clickjacking attacks
  frameguard: {
    action: "deny",
  },

  // X-XSS-Protection: 1; mode=block
  // Legacy XSS protection (modern browsers use CSP)
  xssFilter: true,

  // Referrer-Policy: strict-origin-when-cross-origin
  // Controls referrer information
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  // Remove X-Powered-By header
  hidePoweredBy: true,

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Download Options for IE8+
  ieNoOpen: true,
});

/**
 * Permissions-Policy middleware
 * Restricts browser features to minimize attack surface
 */
export function permissionsPolicyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.setHeader(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", ")
  );
  next();
}

/**
 * Middleware to generate and attach CSP nonce to response locals
 * This nonce can be used in inline scripts/styles
 */
export function cspNonceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.locals.cspNonce = generateNonce();
  next();
}

/**
 * Complete security headers middleware stack
 * Usage: app.use(applySecurityHeaders)
 */
export function applySecurityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Generate nonce first
  cspNonceMiddleware(req, res, () => {
    // Then apply helmet with nonce
    securityHeaders(req, res, () => {
      // Finally apply Permissions-Policy
      permissionsPolicyMiddleware(req, res, next);
    });
  });
}
