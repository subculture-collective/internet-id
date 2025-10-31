import { expect } from "chai";
import { createApp } from "../../scripts/app";
import supertest from "supertest";
import { prisma } from "../../scripts/db";
import { createApiKey } from "../../scripts/services/api-key.service";
import { generateJwtToken } from "../../scripts/services/jwt.service";
import { ethers } from "ethers";

describe("Integration: Public API v1", () => {
  let app: any;
  let request: supertest.SuperTest<supertest.Test>;
  let testUserId: string;
  let testApiKey: string;
  let testJwtToken: string;

  before(async () => {
    app = await createApp();
    request = supertest(app);

    // Create test user
    const user = await prisma.user.create({
      data: {
        address: "0xTestPublicAPIUser",
        email: "test-public-api@example.com",
      },
    });
    testUserId = user.id;

    // Create test API key
    const apiKeyResult = await createApiKey(testUserId, "Test API Key");
    testApiKey = apiKeyResult.key;

    // Generate test JWT token
    testJwtToken = generateJwtToken({
      userId: testUserId,
      address: user.address || undefined,
      tier: "free",
    });
  });

  after(async () => {
    await prisma.apiKey.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe("GET /api/v1/verify/hash/:hash", () => {
    it("should return 404 for non-existent content hash", async () => {
      const hash = "0x" + "0".repeat(64);
      const res = await request.get(`/api/v1/verify/hash/${hash}`);

      expect(res.status).to.equal(404);
      expect(res.body.verified).to.be.false;
      expect(res.body.error).to.equal("Content not registered");
    });

    it("should return 400 for invalid hash format", async () => {
      const res = await request.get("/api/v1/verify/hash/invalid-hash");

      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal("Invalid hash format");
    });
  });

  describe("GET /api/v1/verify/platform", () => {
    it("should return 400 without platform parameters", async () => {
      const res = await request.get("/api/v1/verify/platform");

      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal("Invalid request");
    });

    it("should return 404 for non-existent platform binding", async () => {
      const res = await request
        .get("/api/v1/verify/platform")
        .query({ platform: "youtube", platformId: "nonexistent123" });

      expect(res.status).to.equal(404);
      expect(res.body.verified).to.be.false;
    });
  });

  describe("GET /api/v1/content", () => {
    it("should list content with pagination", async () => {
      const res = await request.get("/api/v1/content").query({ limit: 10, offset: 0 });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("data");
      expect(res.body).to.have.property("pagination");
      expect(res.body.pagination).to.have.property("limit");
      expect(res.body.pagination).to.have.property("offset");
      expect(res.body.pagination).to.have.property("total");
      expect(res.body.pagination).to.have.property("hasMore");
    });

    it("should respect pagination limits", async () => {
      const res = await request.get("/api/v1/content").query({ limit: 5, offset: 0 });

      expect(res.status).to.equal(200);
      expect(res.body.pagination.limit).to.equal(5);
    });

    it("should cap limit at 100", async () => {
      const res = await request.get("/api/v1/content").query({ limit: 200, offset: 0 });

      expect(res.status).to.equal(200);
      expect(res.body.pagination.limit).to.be.at.most(100);
    });
  });

  describe("POST /api/v1/auth/token", () => {
    it("should generate JWT token with valid signature", async () => {
      const wallet = ethers.Wallet.createRandom();
      const message = "Sign in to Internet ID API";
      const signature = await wallet.signMessage(message);

      const res = await request.post("/api/v1/auth/token").send({
        address: wallet.address,
        signature,
        message,
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("token");
      expect(res.body).to.have.property("expiresIn");
      expect(res.body).to.have.property("user");
      expect(res.body.user).to.have.property("id");
      expect(res.body.user.address.toLowerCase()).to.equal(wallet.address.toLowerCase());
    });

    it("should return 400 without required fields", async () => {
      const res = await request.post("/api/v1/auth/token").send({});

      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal("Invalid request");
    });

    it("should return 401 with invalid signature", async () => {
      const wallet = ethers.Wallet.createRandom();
      const res = await request.post("/api/v1/auth/token").send({
        address: wallet.address,
        signature: "0x" + "0".repeat(130), // Invalid signature
        message: "Sign in to Internet ID API",
      });

      expect(res.status).to.equal(401);
    });
  });

  describe("API Key Authentication", () => {
    describe("POST /api/v1/api-keys", () => {
      it("should create API key with JWT authentication", async () => {
        const res = await request
          .post("/api/v1/api-keys")
          .set("Authorization", `Bearer ${testJwtToken}`)
          .send({ name: "Integration Test Key" });

        expect(res.status).to.equal(201);
        expect(res.body.message).to.equal("API key created successfully");
        expect(res.body.data).to.have.property("key");
        expect(res.body.data.key).to.match(/^iid_[a-f0-9]{64}$/);
        expect(res.body.warning).to.exist;

        // Cleanup
        await prisma.apiKey.deleteMany({
          where: { key: { contains: res.body.data.key } },
        });
      });

      it("should return 401 without authentication", async () => {
        const res = await request.post("/api/v1/api-keys").send({ name: "Test Key" });

        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal("Authentication required");
      });
    });

    describe("GET /api/v1/api-keys", () => {
      it("should list API keys with JWT authentication", async () => {
        const res = await request
          .get("/api/v1/api-keys")
          .set("Authorization", `Bearer ${testJwtToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.data).to.be.an("array");
      });

      it("should list API keys with API key authentication", async () => {
        const res = await request.get("/api/v1/api-keys").set("x-api-key", testApiKey);

        expect(res.status).to.equal(200);
        expect(res.body.data).to.be.an("array");
      });

      it("should return 401 without authentication", async () => {
        const res = await request.get("/api/v1/api-keys");

        expect(res.status).to.equal(401);
      });
    });
  });

  describe("Authentication Methods", () => {
    it("should accept x-api-key header", async () => {
      const res = await request.get("/api/v1/api-keys").set("x-api-key", testApiKey);

      expect(res.status).to.equal(200);
    });

    it("should accept Bearer token", async () => {
      const res = await request
        .get("/api/v1/api-keys")
        .set("Authorization", `Bearer ${testJwtToken}`);

      expect(res.status).to.equal(200);
    });

    it("should return 401 with invalid API key", async () => {
      const res = await request.get("/api/v1/api-keys").set("x-api-key", "iid_invalid_key");

      expect(res.status).to.equal(401);
      expect(res.body.error).to.equal("Invalid API key");
    });

    it("should return 401 with invalid JWT token", async () => {
      const res = await request
        .get("/api/v1/api-keys")
        .set("Authorization", "Bearer invalid.jwt.token");

      expect(res.status).to.equal(401);
      expect(res.body.error).to.equal("Invalid or expired JWT token");
    });
  });
});
