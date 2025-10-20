import { expect } from "chai";
import {
  ethereumAddressSchema,
  contentHashSchema,
  ipfsUriSchema,
  httpUriSchema,
  manifestUriSchema,
  platformNameSchema,
  platformIdSchema,
  manifestRequestSchema,
  registerRequestSchema,
  bindRequestSchema,
  bindManyRequestSchema,
  verifyRequestSchema,
  oneshotRequestSchema,
  createUserSchema,
} from "../../scripts/validation/schemas";

describe("Validation Schemas", function () {
  describe("ethereumAddressSchema", function () {
    it("should accept valid Ethereum address", function () {
      const result = ethereumAddressSchema.safeParse("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
      expect(result.success).to.be.true;
    });

    it("should reject address without 0x prefix", function () {
      const result = ethereumAddressSchema.safeParse("742d35Cc6634C0532925a3b844Bc454e4438f44e");
      expect(result.success).to.be.false;
    });

    it("should reject address with wrong length", function () {
      const result = ethereumAddressSchema.safeParse("0x742d35Cc");
      expect(result.success).to.be.false;
    });

    it("should reject address with invalid characters", function () {
      const result = ethereumAddressSchema.safeParse("0x742d35Cc6634C0532925a3b844Bc454e4438f44g");
      expect(result.success).to.be.false;
    });
  });

  describe("contentHashSchema", function () {
    it("should accept valid content hash", function () {
      const result = contentHashSchema.safeParse(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      );
      expect(result.success).to.be.true;
    });

    it("should reject hash with wrong length", function () {
      const result = contentHashSchema.safeParse("0x123456");
      expect(result.success).to.be.false;
    });

    it("should reject hash without 0x prefix", function () {
      const result = contentHashSchema.safeParse(
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      );
      expect(result.success).to.be.false;
    });
  });

  describe("ipfsUriSchema", function () {
    it("should accept valid IPFS URI", function () {
      const result = ipfsUriSchema.safeParse("ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");
      expect(result.success).to.be.true;
    });

    it("should reject HTTP URI", function () {
      const result = ipfsUriSchema.safeParse("https://example.com");
      expect(result.success).to.be.false;
    });

    it("should reject IPFS URI with invalid characters", function () {
      const result = ipfsUriSchema.safeParse("ipfs://invalid/../path");
      expect(result.success).to.be.false;
    });
  });

  describe("httpUriSchema", function () {
    it("should accept valid HTTP URI", function () {
      const result = httpUriSchema.safeParse("http://example.com");
      expect(result.success).to.be.true;
    });

    it("should accept valid HTTPS URI", function () {
      const result = httpUriSchema.safeParse("https://example.com");
      expect(result.success).to.be.true;
    });

    it("should reject non-HTTP(S) URI", function () {
      const result = httpUriSchema.safeParse("ftp://example.com");
      expect(result.success).to.be.false;
    });

    it("should reject malformed URL", function () {
      const result = httpUriSchema.safeParse("not-a-url");
      expect(result.success).to.be.false;
    });
  });

  describe("manifestUriSchema", function () {
    it("should accept IPFS URI", function () {
      const result = manifestUriSchema.safeParse("ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");
      expect(result.success).to.be.true;
    });

    it("should accept HTTP URI", function () {
      const result = manifestUriSchema.safeParse("https://example.com/manifest.json");
      expect(result.success).to.be.true;
    });

    it("should reject invalid URI", function () {
      const result = manifestUriSchema.safeParse("invalid://uri");
      expect(result.success).to.be.false;
    });
  });

  describe("platformNameSchema", function () {
    it("should accept valid platform name", function () {
      const result = platformNameSchema.safeParse("youtube");
      expect(result.success).to.be.true;
    });

    it("should accept platform name with hyphens", function () {
      const result = platformNameSchema.safeParse("tik-tok");
      expect(result.success).to.be.true;
    });

    it("should accept platform name with underscores", function () {
      const result = platformNameSchema.safeParse("social_media");
      expect(result.success).to.be.true;
    });

    it("should reject uppercase letters", function () {
      const result = platformNameSchema.safeParse("YouTube");
      expect(result.success).to.be.false;
    });

    it("should reject platform name with spaces", function () {
      const result = platformNameSchema.safeParse("you tube");
      expect(result.success).to.be.false;
    });

    it("should reject empty platform name", function () {
      const result = platformNameSchema.safeParse("");
      expect(result.success).to.be.false;
    });

    it("should reject platform name that is too long", function () {
      const result = platformNameSchema.safeParse("a".repeat(51));
      expect(result.success).to.be.false;
    });
  });

  describe("platformIdSchema", function () {
    it("should accept valid platform ID", function () {
      const result = platformIdSchema.safeParse("dQw4w9WgXcQ");
      expect(result.success).to.be.true;
    });

    it("should accept platform ID with slashes", function () {
      const result = platformIdSchema.safeParse("user/status/123456789");
      expect(result.success).to.be.true;
    });

    it("should accept platform ID with special chars", function () {
      const result = platformIdSchema.safeParse("user@domain:123");
      expect(result.success).to.be.true;
    });

    it("should reject platform ID that is too long", function () {
      const result = platformIdSchema.safeParse("a".repeat(501));
      expect(result.success).to.be.false;
    });

    it("should reject empty platform ID", function () {
      const result = platformIdSchema.safeParse("");
      expect(result.success).to.be.false;
    });
  });

  describe("manifestRequestSchema", function () {
    it("should accept valid manifest request", function () {
      const result = manifestRequestSchema.safeParse({
        contentUri: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        upload: "true",
      });
      expect(result.success).to.be.true;
    });

    it("should reject request without contentUri", function () {
      const result = manifestRequestSchema.safeParse({
        upload: "true",
      });
      expect(result.success).to.be.false;
    });

    it("should reject invalid upload value", function () {
      const result = manifestRequestSchema.safeParse({
        contentUri: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        upload: "yes",
      });
      expect(result.success).to.be.false;
    });
  });

  describe("registerRequestSchema", function () {
    it("should accept valid register request", function () {
      const result = registerRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        manifestURI: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      });
      expect(result.success).to.be.true;
    });

    it("should reject request without registryAddress", function () {
      const result = registerRequestSchema.safeParse({
        manifestURI: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      });
      expect(result.success).to.be.false;
    });

    it("should reject request without manifestURI", function () {
      const result = registerRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      });
      expect(result.success).to.be.false;
    });
  });

  describe("bindRequestSchema", function () {
    it("should accept valid bind request", function () {
      const result = bindRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        platform: "youtube",
        platformId: "dQw4w9WgXcQ",
        contentHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      });
      expect(result.success).to.be.true;
    });

    it("should reject request with missing fields", function () {
      const result = bindRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        platform: "youtube",
      });
      expect(result.success).to.be.false;
    });
  });

  describe("bindManyRequestSchema", function () {
    it("should accept valid bind-many request", function () {
      const result = bindManyRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        contentHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        bindings: [
          { platform: "youtube", platformId: "dQw4w9WgXcQ" },
          { platform: "tiktok", platformId: "@user/video/123" },
        ],
      });
      expect(result.success).to.be.true;
    });

    it("should reject request with empty bindings array", function () {
      const result = bindManyRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        contentHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        bindings: [],
      });
      expect(result.success).to.be.false;
    });

    it("should reject request with too many bindings", function () {
      const bindings = Array(51)
        .fill(null)
        .map(() => ({ platform: "youtube", platformId: "test" }));
      const result = bindManyRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        contentHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        bindings,
      });
      expect(result.success).to.be.false;
    });
  });

  describe("verifyRequestSchema", function () {
    it("should accept valid verify request", function () {
      const result = verifyRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        manifestURI: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      });
      expect(result.success).to.be.true;
    });

    it("should accept verify request with rpcUrl", function () {
      const result = verifyRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        manifestURI: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        rpcUrl: "https://sepolia.base.org",
      });
      expect(result.success).to.be.true;
    });
  });

  describe("oneshotRequestSchema", function () {
    it("should accept valid oneshot request", function () {
      const result = oneshotRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        platform: "youtube",
        platformId: "dQw4w9WgXcQ",
        uploadContent: "true",
      });
      expect(result.success).to.be.true;
    });

    it("should accept oneshot request without platform", function () {
      const result = oneshotRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      });
      expect(result.success).to.be.true;
    });

    it("should accept oneshot request with bindings array", function () {
      const result = oneshotRequestSchema.safeParse({
        registryAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        bindings: [
          { platform: "youtube", platformId: "dQw4w9WgXcQ" },
        ],
      });
      expect(result.success).to.be.true;
    });
  });

  describe("createUserSchema", function () {
    it("should accept valid user with address", function () {
      const result = createUserSchema.safeParse({
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      });
      expect(result.success).to.be.true;
    });

    it("should accept valid user with email", function () {
      const result = createUserSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).to.be.true;
    });

    it("should accept valid user with name", function () {
      const result = createUserSchema.safeParse({
        name: "John Doe",
      });
      expect(result.success).to.be.true;
    });

    it("should reject invalid email", function () {
      const result = createUserSchema.safeParse({
        email: "not-an-email",
      });
      expect(result.success).to.be.false;
    });

    it("should reject name with special characters", function () {
      const result = createUserSchema.safeParse({
        name: "John<script>alert('xss')</script>",
      });
      expect(result.success).to.be.false;
    });

    it("should reject empty user object", function () {
      const result = createUserSchema.safeParse({});
      expect(result.success).to.be.false;
    });
  });

  describe("Security: XSS Prevention", function () {
    it("should reject platform name with script tags", function () {
      const result = platformNameSchema.safeParse("<script>alert('xss')</script>");
      expect(result.success).to.be.false;
    });

    it("should reject platform ID with null bytes", function () {
      const result = platformIdSchema.safeParse("test\0malicious");
      expect(result.success).to.be.false;
    });
  });

  describe("Security: SQL Injection Prevention", function () {
    it("should reject Ethereum address with SQL injection attempt", function () {
      const result = ethereumAddressSchema.safeParse("0x' OR '1'='1");
      expect(result.success).to.be.false;
    });
  });

  describe("Security: Path Traversal Prevention", function () {
    it("should reject IPFS URI with path traversal", function () {
      const result = ipfsUriSchema.safeParse("ipfs://../../../etc/passwd");
      expect(result.success).to.be.false;
    });
  });
});
