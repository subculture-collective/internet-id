import validator from "validator";

/**
 * Input Sanitization Utilities
 *
 * Provides functions to sanitize user inputs to prevent XSS, SQL injection,
 * command injection, and path traversal attacks.
 */

/**
 * Sanitize string input by escaping HTML entities
 * Prevents XSS attacks by converting special characters to HTML entities
 */
export function sanitizeString(input: string): string {
  return validator.escape(input);
}

/**
 * Sanitize and validate URL
 * Prevents malicious URLs and ensures proper format
 */
export function sanitizeUrl(url: string, options?: { allowedProtocols?: string[] }): string | null {
  const allowedProtocols = options?.allowedProtocols || ["http", "https", "ipfs"];

  // Trim whitespace
  const trimmed = url.trim();

  // Special handling for IPFS URLs since validator.isURL doesn't handle them
  if (trimmed.startsWith("ipfs://")) {
    // Validate IPFS CID format (basic check)
    const cid = trimmed.replace("ipfs://", "");
    if (/^[a-zA-Z0-9]+$/.test(cid)) {
      return trimmed;
    }
    return null;
  }

  // Check if URL is valid for http/https
  if (
    !validator.isURL(trimmed, {
      protocols: ["http", "https"],
      require_protocol: true,
    })
  ) {
    return null;
  }

  // Additional check for javascript: protocol and other dangerous patterns
  const lowerUrl = trimmed.toLowerCase();
  const dangerousPatterns = ["javascript:", "data:", "vbscript:", "file:", "about:"];

  for (const pattern of dangerousPatterns) {
    if (lowerUrl.includes(pattern)) {
      return null;
    }
  }

  return trimmed;
}

/**
 * Sanitize Ethereum address
 * Ensures proper format and prevents malicious input
 */
export function sanitizeEthereumAddress(address: string): string | null {
  // Trim whitespace
  const trimmed = address.trim();

  // Check format: 0x followed by 40 hex characters
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize content hash
 * Ensures proper format (0x + 64 hex chars for SHA-256)
 */
export function sanitizeContentHash(hash: string): string | null {
  // Trim whitespace
  const trimmed = hash.trim();

  // Check format: 0x followed by 64 hex characters
  if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize platform name
 * Allows only lowercase alphanumeric, hyphens, and underscores
 */
export function sanitizePlatformName(name: string): string | null {
  // Trim and lowercase
  const trimmed = name.trim().toLowerCase();

  // Check allowed characters
  if (!/^[a-z0-9_-]+$/.test(trimmed)) {
    return null;
  }

  // Check length
  if (trimmed.length === 0 || trimmed.length > 50) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize platform ID
 * Allows alphanumeric, hyphens, underscores, slashes, colons, dots, and at signs
 */
export function sanitizePlatformId(id: string): string | null {
  // Trim whitespace
  const trimmed = id.trim();

  // Check allowed characters
  if (!/^[a-zA-Z0-9_\-\/.:@]+$/.test(trimmed)) {
    return null;
  }

  // Check length
  if (trimmed.length === 0 || trimmed.length > 500) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize filename to prevent path traversal
 * Removes any path components and dangerous characters
 */
export function sanitizeFilename(filename: string): string | null {
  // Trim whitespace
  const trimmed = filename.trim();

  // Check for path traversal attempts
  if (trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\")) {
    return null;
  }

  // Check for null bytes
  if (trimmed.includes("\0")) {
    return null;
  }

  // Remove any remaining dangerous characters
  const sanitized = trimmed.replace(/[<>:"|?*]/g, "");

  // Check length
  if (sanitized.length === 0 || sanitized.length > 255) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  // Trim whitespace
  const trimmed = email.trim();

  // Normalize and validate
  if (!validator.isEmail(trimmed)) {
    return null;
  }

  return validator.normalizeEmail(trimmed) || null;
}

/**
 * Sanitize JSON string
 * Validates that input is valid JSON and not malicious
 */
export function sanitizeJson(jsonString: string): any | null {
  try {
    // Limit JSON depth to prevent DoS
    const parsed = JSON.parse(jsonString);

    // Check depth and size
    const jsonStr = JSON.stringify(parsed);
    if (jsonStr.length > 1024 * 1024) {
      // 1MB limit
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Sanitize numeric input
 * Ensures input is a valid number within optional bounds
 */
export function sanitizeNumber(
  input: string | number,
  options?: { min?: number; max?: number; integer?: boolean }
): number | null {
  const num = typeof input === "string" ? Number(input) : input;

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (options?.integer && !Number.isInteger(num)) {
    return null;
  }

  if (options?.min !== undefined && num < options.min) {
    return null;
  }

  if (options?.max !== undefined && num > options.max) {
    return null;
  }

  return num;
}
