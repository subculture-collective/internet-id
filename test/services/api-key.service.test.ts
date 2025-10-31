import { expect } from "chai";
import { prisma } from "../../scripts/db";
import {
  createApiKey,
  verifyApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
} from "../../scripts/services/api-key.service";

describe("API Key Service", () => {
  let testUserId: string;

  before(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        address: "0xTestUser123",
        email: "test@example.com",
      },
    });
    testUserId = user.id;
  });

  after(async () => {
    // Cleanup
    await prisma.apiKey.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe("createApiKey", () => {
    it("should create an API key with default settings", async () => {
      const result = await createApiKey(testUserId);

      expect(result).to.have.property("id");
      expect(result).to.have.property("key");
      expect(result.key).to.match(/^iid_[a-f0-9]{64}$/);
      expect(result.tier).to.equal("free");
      expect(result.rateLimit).to.equal(100);
    });

    it("should create an API key with custom name and tier", async () => {
      const result = await createApiKey(testUserId, "Test Key", "paid");

      expect(result.name).to.equal("Test Key");
      expect(result.tier).to.equal("paid");
      expect(result.rateLimit).to.equal(1000);
    });

    it("should create an API key with expiration", async () => {
      const expiresAt = new Date("2025-12-31");
      const result = await createApiKey(testUserId, "Expiring Key", "free", expiresAt);

      expect(result.expiresAt).to.exist;
      expect(new Date(result.expiresAt!).getTime()).to.equal(expiresAt.getTime());
    });
  });

  describe("verifyApiKey", () => {
    let validKey: string;
    let validKeyId: string;

    beforeEach(async () => {
      const result = await createApiKey(testUserId, "Verify Test Key");
      validKey = result.key;
      validKeyId = result.id;
    });

    afterEach(async () => {
      await prisma.apiKey.deleteMany({ where: { id: validKeyId } });
    });

    it("should verify a valid API key", async () => {
      const result = await verifyApiKey(validKey);

      expect(result).to.exist;
      expect(result!.userId).to.equal(testUserId);
      expect(result!.tier).to.equal("free");
      expect(result!.rateLimit).to.equal(100);
    });

    it("should return null for invalid API key", async () => {
      const result = await verifyApiKey("iid_invalid_key_123");

      expect(result).to.be.null;
    });

    it("should return null for revoked API key", async () => {
      await revokeApiKey(validKeyId, testUserId);
      const result = await verifyApiKey(validKey);

      expect(result).to.be.null;
    });

    it("should return null for expired API key", async () => {
      // Update key to be expired
      await prisma.apiKey.update({
        where: { id: validKeyId },
        data: { expiresAt: new Date("2020-01-01") },
      });

      const result = await verifyApiKey(validKey);

      expect(result).to.be.null;
    });

    it("should update lastUsedAt timestamp", async () => {
      const before = await prisma.apiKey.findUnique({
        where: { id: validKeyId },
        select: { lastUsedAt: true },
      });

      await verifyApiKey(validKey);

      const after = await prisma.apiKey.findUnique({
        where: { id: validKeyId },
        select: { lastUsedAt: true },
      });

      expect(after!.lastUsedAt).to.not.be.null;
      expect(after!.lastUsedAt!.getTime()).to.be.greaterThan(before?.lastUsedAt?.getTime() || 0);
    });
  });

  describe("listApiKeys", () => {
    beforeEach(async () => {
      // Create multiple keys
      await createApiKey(testUserId, "Key 1");
      await createApiKey(testUserId, "Key 2", "paid");
    });

    afterEach(async () => {
      await prisma.apiKey.deleteMany({ where: { userId: testUserId } });
    });

    it("should list all API keys for a user", async () => {
      const keys = await listApiKeys(testUserId);

      expect(keys).to.have.length.at.least(2);
      expect(keys[0]).to.not.have.property("key"); // Should not expose actual keys
      expect(keys[0]).to.have.property("name");
      expect(keys[0]).to.have.property("tier");
      expect(keys[0]).to.have.property("isActive");
    });

    it("should return keys in descending order by createdAt", async () => {
      const keys = await listApiKeys(testUserId);

      for (let i = 1; i < keys.length; i++) {
        const prev = new Date(keys[i - 1].createdAt).getTime();
        const curr = new Date(keys[i].createdAt).getTime();
        expect(prev).to.be.at.least(curr);
      }
    });
  });

  describe("revokeApiKey", () => {
    let keyId: string;

    beforeEach(async () => {
      const result = await createApiKey(testUserId, "Key to Revoke");
      keyId = result.id;
    });

    afterEach(async () => {
      await prisma.apiKey.deleteMany({ where: { id: keyId } });
    });

    it("should revoke an API key", async () => {
      await revokeApiKey(keyId, testUserId);

      const key = await prisma.apiKey.findUnique({
        where: { id: keyId },
      });

      expect(key!.isActive).to.be.false;
    });

    it("should not revoke a key belonging to another user", async () => {
      await revokeApiKey(keyId, "wrong-user-id");

      const key = await prisma.apiKey.findUnique({
        where: { id: keyId },
      });

      expect(key!.isActive).to.be.true;
    });
  });

  describe("deleteApiKey", () => {
    let keyId: string;

    beforeEach(async () => {
      const result = await createApiKey(testUserId, "Key to Delete");
      keyId = result.id;
    });

    it("should delete an API key", async () => {
      await deleteApiKey(keyId, testUserId);

      const key = await prisma.apiKey.findUnique({
        where: { id: keyId },
      });

      expect(key).to.be.null;
    });

    it("should not delete a key belonging to another user", async () => {
      await deleteApiKey(keyId, "wrong-user-id");

      const key = await prisma.apiKey.findUnique({
        where: { id: keyId },
      });

      expect(key).to.not.be.null;
    });
  });
});
