import { z } from "zod";

/**
 * Validation Schemas for API Endpoints
 *
 * These schemas define the expected structure and constraints for all API requests.
 * They help prevent injection attacks, malformed data, and security vulnerabilities.
 */

// Common validators
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format");

export const contentHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid content hash format (must be 0x + 64 hex chars)");

export const ipfsUriSchema = z
  .string()
  .regex(
    /^ipfs:\/\/[a-zA-Z0-9]+$/,
    "Invalid IPFS URI format (must be ipfs:// followed by base58-encoded CID)"
  );

export const httpUriSchema = z
  .string()
  .url("Invalid HTTP/HTTPS URL")
  .regex(/^https?:\/\//, "URL must start with http:// or https://");

export const manifestUriSchema = z.union([ipfsUriSchema, httpUriSchema]);

// Platform identifiers - alphanumeric, hyphens, underscores, slashes (for paths)
export const platformNameSchema = z
  .string()
  .min(1, "Platform name is required")
  .max(50, "Platform name too long")
  .regex(/^[a-z0-9_-]+$/, "Platform name must be lowercase alphanumeric with hyphens/underscores");

export const platformIdSchema = z
  .string()
  .min(1, "Platform ID is required")
  .max(500, "Platform ID too long")
  .regex(/^[a-zA-Z0-9_\-\/.:@]+$/, "Platform ID contains invalid characters");

// File upload constraints
export const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Video
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  // Documents
  "application/pdf",
  "text/plain",
  "application/json",
];

export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

// Schema for file upload validation
export const fileUploadSchema = z.object({
  mimetype: z
    .string()
    .refine((mime) => ALLOWED_MIME_TYPES.includes(mime), "File type not allowed")
    .optional(),
  size: z.number().max(MAX_FILE_SIZE, "File size exceeds 1GB limit").optional(),
});

// Upload endpoint validation
export const uploadRequestSchema = z.object({
  // File is handled by multer, no body params expected
});

// Manifest endpoint validation
export const manifestRequestSchema = z.object({
  contentUri: z
    .string()
    .min(1, "contentUri is required")
    .max(1000, "contentUri too long")
    .refine(
      (uri) => uri.startsWith("ipfs://") || uri.startsWith("http://") || uri.startsWith("https://"),
      "contentUri must be a valid IPFS or HTTP(S) URI"
    ),
  upload: z
    .string()
    .optional()
    .refine((val) => !val || val === "true" || val === "false", "upload must be 'true' or 'false'"),
  contentHash: contentHashSchema.optional(),
});

// Register endpoint validation
export const registerRequestSchema = z.object({
  registryAddress: ethereumAddressSchema,
  manifestURI: manifestUriSchema,
  contentHash: contentHashSchema.optional(),
});

// Bind platform endpoint validation
export const bindRequestSchema = z.object({
  registryAddress: ethereumAddressSchema,
  platform: platformNameSchema,
  platformId: platformIdSchema,
  contentHash: contentHashSchema,
});

// Bind many platforms validation
export const bindingSchema = z.object({
  platform: platformNameSchema,
  platformId: platformIdSchema,
});

export const bindManyRequestSchema = z.object({
  registryAddress: ethereumAddressSchema,
  contentHash: contentHashSchema,
  bindings: z
    .array(bindingSchema)
    .min(1, "At least one binding is required")
    .max(50, "Too many bindings (max 50)"),
});

// Verify endpoint validation
export const verifyRequestSchema = z.object({
  registryAddress: ethereumAddressSchema,
  manifestURI: manifestUriSchema,
  rpcUrl: httpUriSchema.optional(),
});

// Proof endpoint validation
export const proofRequestSchema = z.object({
  registryAddress: ethereumAddressSchema,
  manifestURI: manifestUriSchema,
  rpcUrl: httpUriSchema.optional(),
});

// One-shot endpoint validation
export const oneshotRequestSchema = z.object({
  registryAddress: ethereumAddressSchema,
  platform: platformNameSchema.optional(),
  platformId: platformIdSchema.optional(),
  uploadContent: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "true" || val === "false",
      "uploadContent must be 'true' or 'false'"
    ),
  bindings: z
    .union([
      z.string().refine((str) => {
        try {
          const parsed = JSON.parse(str);
          return Array.isArray(parsed);
        } catch {
          return false;
        }
      }, "bindings must be a valid JSON array"),
      z.array(bindingSchema),
    ])
    .optional(),
});

// Query parameter schemas
export const resolveQuerySchema = z
  .object({
    url: z.string().max(2000, "URL too long").optional(),
    platform: platformNameSchema.optional(),
    platformId: platformIdSchema.optional(),
  })
  .refine(
    (data) => data.url || (data.platform && data.platformId),
    "Either 'url' or both 'platform' and 'platformId' must be provided"
  );

export const publicVerifyQuerySchema = resolveQuerySchema;

export const verificationsQuerySchema = z.object({
  contentHash: contentHashSchema.optional(),
  limit: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 100),
      "limit must be a number between 1 and 100"
    ),
});

export const contentHashParamSchema = z.object({
  hash: contentHashSchema,
});

// User creation (minimal)
export const createUserSchema = z
  .object({
    address: ethereumAddressSchema.optional(),
    email: z.string().email("Invalid email address").max(255, "Email too long").optional(),
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name too long")
      .regex(/^[a-zA-Z0-9 _.-]+$/, "Name contains invalid characters")
      .optional(),
  })
  .refine(
    (data) => data.address || data.email || data.name,
    "At least one of address, email, or name is required"
  );
