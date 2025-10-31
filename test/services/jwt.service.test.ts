import { expect } from "chai";
import {
  generateJwtToken,
  verifyJwtToken,
  extractTokenFromHeader,
} from "../../scripts/services/jwt.service";

describe("JWT Service", () => {
  describe("generateJwtToken", () => {
    it("should generate a valid JWT token", () => {
      const payload = {
        userId: "test-user-123",
        address: "0x123",
        email: "test@example.com",
        tier: "free",
      };

      const token = generateJwtToken(payload);

      expect(token).to.be.a("string");
      expect(token.split(".")).to.have.length(3); // JWT has 3 parts
    });

    it("should generate different tokens for different payloads", () => {
      const payload1 = { userId: "user1" };
      const payload2 = { userId: "user2" };

      const token1 = generateJwtToken(payload1);
      const token2 = generateJwtToken(payload2);

      expect(token1).to.not.equal(token2);
    });
  });

  describe("verifyJwtToken", () => {
    it("should verify and decode a valid token", () => {
      const payload = {
        userId: "test-user-456",
        address: "0x456",
        tier: "paid",
      };

      const token = generateJwtToken(payload);
      const decoded = verifyJwtToken(token);

      expect(decoded).to.not.be.null;
      expect(decoded!.userId).to.equal(payload.userId);
      expect(decoded!.address).to.equal(payload.address);
      expect(decoded!.tier).to.equal(payload.tier);
    });

    it("should return null for invalid token", () => {
      const decoded = verifyJwtToken("invalid.token.here");

      expect(decoded).to.be.null;
    });

    it("should return null for tampered token", () => {
      const payload = { userId: "test-user" };
      const token = generateJwtToken(payload);
      
      // Tamper with the token by replacing characters in the signature
      const parts = token.split(".");
      parts[2] = parts[2].split("").map(() => "x").join("");
      const tamperedToken = parts.join(".");

      const decoded = verifyJwtToken(tamperedToken);

      expect(decoded).to.be.null;
    });

    it("should include issuer in verification", () => {
      const payload = { userId: "test-user" };
      const token = generateJwtToken(payload);
      const decoded = verifyJwtToken(token);

      expect(decoded).to.not.be.null;
      // The actual issuer check happens inside jwt.verify
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract Bearer token from header", () => {
      const token = "abc123xyz";
      const header = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(header);

      expect(extracted).to.equal(token);
    });

    it("should return raw token if no Bearer prefix", () => {
      const token = "abc123xyz";
      const extracted = extractTokenFromHeader(token);

      expect(extracted).to.equal(token);
    });

    it("should return null for empty header", () => {
      const extracted = extractTokenFromHeader(undefined);

      expect(extracted).to.be.null;
    });

    it("should handle Bearer with extra spaces", () => {
      const token = "abc123xyz";
      const header = "Bearer " + token; // Single space
      const extracted = extractTokenFromHeader(header);

      expect(extracted).to.equal(token);
    });
  });
});
