import { expect } from "chai";
import {
  sanitizeString,
  sanitizeUrl,
  sanitizeEthereumAddress,
  sanitizeContentHash,
  sanitizePlatformName,
  sanitizePlatformId,
  sanitizeFilename,
  sanitizeEmail,
  sanitizeJson,
  sanitizeNumber,
} from "../../scripts/validation/sanitization";

describe("Sanitization Utilities", function () {
  describe("sanitizeString", function () {
    it("should escape HTML entities", function () {
      const result = sanitizeString("<script>alert('xss')</script>");
      expect(result).to.not.include("<script>");
      expect(result).to.not.include("</script>");
    });

    it("should escape special characters", function () {
      const result = sanitizeString("Hello & <World>");
      expect(result).to.include("&amp;");
      expect(result).to.include("&lt;");
      expect(result).to.include("&gt;");
    });

    it("should not modify safe strings", function () {
      const result = sanitizeString("Hello World");
      expect(result).to.equal("Hello World");
    });
  });

  describe("sanitizeUrl", function () {
    it("should accept valid HTTP URL", function () {
      const result = sanitizeUrl("http://example.com");
      expect(result).to.equal("http://example.com");
    });

    it("should accept valid HTTPS URL", function () {
      const result = sanitizeUrl("https://example.com");
      expect(result).to.equal("https://example.com");
    });

    it("should accept valid IPFS URL", function () {
      const result = sanitizeUrl("ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");
      expect(result).to.equal("ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");
    });

    it("should reject javascript: protocol", function () {
      const result = sanitizeUrl("javascript:alert('xss')");
      expect(result).to.be.null;
    });

    it("should reject data: protocol", function () {
      const result = sanitizeUrl("data:text/html,<script>alert('xss')</script>");
      expect(result).to.be.null;
    });

    it("should reject invalid URLs", function () {
      const result = sanitizeUrl("not-a-url");
      expect(result).to.be.null;
    });

    it("should trim whitespace", function () {
      const result = sanitizeUrl("  https://example.com  ");
      expect(result).to.equal("https://example.com");
    });
  });

  describe("sanitizeEthereumAddress", function () {
    it("should accept valid Ethereum address", function () {
      const result = sanitizeEthereumAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
      expect(result).to.equal("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
    });

    it("should reject address without 0x prefix", function () {
      const result = sanitizeEthereumAddress("742d35Cc6634C0532925a3b844Bc454e4438f44e");
      expect(result).to.be.null;
    });

    it("should reject address with wrong length", function () {
      const result = sanitizeEthereumAddress("0x123");
      expect(result).to.be.null;
    });

    it("should reject address with invalid characters", function () {
      const result = sanitizeEthereumAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44g");
      expect(result).to.be.null;
    });

    it("should trim whitespace", function () {
      const result = sanitizeEthereumAddress("  0x742d35Cc6634C0532925a3b844Bc454e4438f44e  ");
      expect(result).to.equal("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
    });
  });

  describe("sanitizeContentHash", function () {
    it("should accept valid content hash", function () {
      const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const result = sanitizeContentHash(hash);
      expect(result).to.equal(hash);
    });

    it("should reject hash with wrong length", function () {
      const result = sanitizeContentHash("0x123");
      expect(result).to.be.null;
    });

    it("should reject hash without 0x prefix", function () {
      const result = sanitizeContentHash(
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      );
      expect(result).to.be.null;
    });

    it("should trim whitespace", function () {
      const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const result = sanitizeContentHash(`  ${hash}  `);
      expect(result).to.equal(hash);
    });
  });

  describe("sanitizePlatformName", function () {
    it("should accept valid platform name", function () {
      const result = sanitizePlatformName("youtube");
      expect(result).to.equal("youtube");
    });

    it("should convert to lowercase", function () {
      const result = sanitizePlatformName("YouTube");
      expect(result).to.equal("youtube");
    });

    it("should accept hyphens and underscores", function () {
      const result = sanitizePlatformName("tik-tok_platform");
      expect(result).to.equal("tik-tok_platform");
    });

    it("should reject special characters", function () {
      const result = sanitizePlatformName("you<script>");
      expect(result).to.be.null;
    });

    it("should reject platform name that is too long", function () {
      const result = sanitizePlatformName("a".repeat(51));
      expect(result).to.be.null;
    });

    it("should reject empty string", function () {
      const result = sanitizePlatformName("");
      expect(result).to.be.null;
    });

    it("should trim whitespace", function () {
      const result = sanitizePlatformName("  youtube  ");
      expect(result).to.equal("youtube");
    });
  });

  describe("sanitizePlatformId", function () {
    it("should accept valid platform ID", function () {
      const result = sanitizePlatformId("dQw4w9WgXcQ");
      expect(result).to.equal("dQw4w9WgXcQ");
    });

    it("should accept platform ID with slashes", function () {
      const result = sanitizePlatformId("user/status/123456789");
      expect(result).to.equal("user/status/123456789");
    });

    it("should accept special characters", function () {
      const result = sanitizePlatformId("user@domain:123");
      expect(result).to.equal("user@domain:123");
    });

    it("should reject invalid characters", function () {
      const result = sanitizePlatformId("user<script>");
      expect(result).to.be.null;
    });

    it("should reject platform ID that is too long", function () {
      const result = sanitizePlatformId("a".repeat(501));
      expect(result).to.be.null;
    });

    it("should reject empty string", function () {
      const result = sanitizePlatformId("");
      expect(result).to.be.null;
    });

    it("should trim whitespace", function () {
      const result = sanitizePlatformId("  dQw4w9WgXcQ  ");
      expect(result).to.equal("dQw4w9WgXcQ");
    });
  });

  describe("sanitizeFilename", function () {
    it("should accept valid filename", function () {
      const result = sanitizeFilename("document.pdf");
      expect(result).to.equal("document.pdf");
    });

    it("should reject path traversal with ..", function () {
      const result = sanitizeFilename("../../../etc/passwd");
      expect(result).to.be.null;
    });

    it("should reject filename with forward slash", function () {
      const result = sanitizeFilename("path/to/file.txt");
      expect(result).to.be.null;
    });

    it("should reject filename with backslash", function () {
      const result = sanitizeFilename("path\\to\\file.txt");
      expect(result).to.be.null;
    });

    it("should reject filename with null byte", function () {
      const result = sanitizeFilename("file\0malicious.txt");
      expect(result).to.be.null;
    });

    it("should remove dangerous characters", function () {
      const result = sanitizeFilename("file<name>.txt");
      expect(result).to.equal("filename.txt");
    });

    it("should reject filename that is too long", function () {
      const result = sanitizeFilename("a".repeat(256) + ".txt");
      expect(result).to.be.null;
    });

    it("should trim whitespace", function () {
      const result = sanitizeFilename("  document.pdf  ");
      expect(result).to.equal("document.pdf");
    });
  });

  describe("sanitizeEmail", function () {
    it("should accept valid email", function () {
      const result = sanitizeEmail("user@example.com");
      expect(result).to.not.be.null;
    });

    it("should normalize email", function () {
      const result = sanitizeEmail("User@Example.com");
      expect(result).to.equal("user@example.com");
    });

    it("should reject invalid email", function () {
      const result = sanitizeEmail("not-an-email");
      expect(result).to.be.null;
    });

    it("should trim whitespace", function () {
      const result = sanitizeEmail("  user@example.com  ");
      expect(result).to.not.be.null;
    });
  });

  describe("sanitizeJson", function () {
    it("should accept valid JSON", function () {
      const result = sanitizeJson('{"key": "value"}');
      expect(result).to.deep.equal({ key: "value" });
    });

    it("should reject invalid JSON", function () {
      const result = sanitizeJson("{not valid json}");
      expect(result).to.be.null;
    });

    it("should reject JSON that is too large", function () {
      const largeObject = { data: "a".repeat(1024 * 1024 + 1) };
      const result = sanitizeJson(JSON.stringify(largeObject));
      expect(result).to.be.null;
    });

    it("should parse nested JSON", function () {
      const result = sanitizeJson('{"nested": {"key": "value"}}');
      expect(result).to.deep.equal({ nested: { key: "value" } });
    });
  });

  describe("sanitizeNumber", function () {
    it("should accept valid number", function () {
      const result = sanitizeNumber(42);
      expect(result).to.equal(42);
    });

    it("should accept string number", function () {
      const result = sanitizeNumber("42");
      expect(result).to.equal(42);
    });

    it("should reject NaN", function () {
      const result = sanitizeNumber("not-a-number");
      expect(result).to.be.null;
    });

    it("should reject Infinity", function () {
      const result = sanitizeNumber(Infinity);
      expect(result).to.be.null;
    });

    it("should enforce minimum value", function () {
      const result = sanitizeNumber(5, { min: 10 });
      expect(result).to.be.null;
    });

    it("should enforce maximum value", function () {
      const result = sanitizeNumber(15, { max: 10 });
      expect(result).to.be.null;
    });

    it("should enforce integer constraint", function () {
      const result = sanitizeNumber(3.14, { integer: true });
      expect(result).to.be.null;
    });

    it("should accept integer when constraint is true", function () {
      const result = sanitizeNumber(42, { integer: true });
      expect(result).to.equal(42);
    });
  });

  describe("Security: Malicious Input Prevention", function () {
    it("should handle script injection in string", function () {
      const result = sanitizeString("<img src=x onerror=alert('xss')>");
      expect(result).to.not.include("<img");
      expect(result).to.not.include("<");
    });

    it("should reject SQL injection in platform name", function () {
      const result = sanitizePlatformName("youtube' OR '1'='1");
      expect(result).to.be.null;
    });

    it("should reject command injection in filename", function () {
      const result = sanitizeFilename("file.txt; rm -rf /");
      expect(result).to.be.null;
    });
  });
});
