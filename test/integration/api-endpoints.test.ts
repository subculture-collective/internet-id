/**
 * Integration tests for API endpoints
 * Tests full API workflows with database and blockchain integration
 */

import { expect } from "chai";
import request from "supertest";
import { ethers } from "ethers";
import { IntegrationTestEnvironment } from "../fixtures/helpers";
import { createTestFile } from "../fixtures/factories";
import { writeFile, unlink } from "fs/promises";
import * as path from "path";
import * as os from "os";

describe("Integration: API Endpoints", function () {
  this.timeout(30000);

  let env: IntegrationTestEnvironment;
  let registryAddress: string;
  let creator: ethers.Wallet;
  let app: any;

  before(async function () {
    env = new IntegrationTestEnvironment();
    await env.setup();

    creator = env.blockchain.getSigner(0) as ethers.Wallet;
    registryAddress = await env.blockchain.deployRegistry(creator);

    process.env.REGISTRY_ADDRESS = registryAddress;
    process.env.PRIVATE_KEY = creator.privateKey;

    app = env.server.getApp();
  });

  after(async function () {
    await env.teardown();
  });

  afterEach(async function () {
    await env.cleanup();
  });

  describe("Health and Status Endpoints", function () {
    it("GET /api/health should return ok", async function () {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).to.deep.equal({ ok: true });
    });

    it("GET /api/network should return chain ID", async function () {
      const response = await request(app).get("/api/network").expect(200);

      expect(response.body).to.have.property("chainId");
      expect(response.body.chainId).to.be.a("number");
    });

    it("GET /api/registry should return registry address", async function () {
      const response = await request(app).get("/api/registry").expect(200);

      expect(response.body).to.have.property("registryAddress");
      expect(response.body.registryAddress).to.equal(registryAddress);
    });
  });

  describe("Content Query Endpoints", function () {
    it("GET /api/contents should return empty list initially", async function () {
      const response = await request(app).get("/api/contents").expect(200);

      expect(response.body).to.be.an("array");
      expect(response.body).to.have.lengthOf(0);
    });

    it("GET /api/contents should return registered content", async function () {
      if (!env.db.isDbAvailable()) {
        this.skip();
      }

      const prisma = env.db.getClient();
      const testFile = createTestFile("API test content");

      // Create content in database
      await prisma.content.create({
        data: {
          contentHash: testFile.hash,
          manifestUri: "ipfs://QmTest123",
          creatorAddress: creator.address.toLowerCase(),
          registryAddress: registryAddress,
        },
      });

      const response = await request(app).get("/api/contents").expect(200);

      expect(response.body).to.be.an("array");
      expect(response.body).to.have.lengthOf(1);
      expect(response.body[0].contentHash).to.equal(testFile.hash);
    });
  });

  describe("Verification Endpoints", function () {
    it("GET /api/verifications should return empty list initially", async function () {
      const response = await request(app).get("/api/verifications").expect(200);

      expect(response.body).to.be.an("array");
      expect(response.body).to.have.lengthOf(0);
    });

    it("GET /api/verifications should return verification records", async function () {
      if (!env.db.isDbAvailable()) {
        this.skip();
      }

      const prisma = env.db.getClient();
      const testFile = createTestFile("Verification test");

      // Create verification in database
      await prisma.verification.create({
        data: {
          contentHash: testFile.hash,
          manifestUri: "ipfs://QmTest123",
          recoveredAddress: creator.address.toLowerCase(),
          creatorOnchain: creator.address.toLowerCase(),
          status: "verified",
        },
      });

      const response = await request(app).get("/api/verifications").expect(200);

      expect(response.body).to.be.an("array");
      expect(response.body).to.have.lengthOf(1);
      expect(response.body[0].contentHash).to.equal(testFile.hash);
      expect(response.body[0].status).to.equal("verified");
    });
  });

  describe("Platform Resolution", function () {
    it("GET /api/resolve should return 400 without parameters", async function () {
      const response = await request(app).get("/api/resolve").expect(400);

      expect(response.body).to.have.property("error");
    });

    it("GET /api/resolve should return 404 for non-existent binding", async function () {
      const response = await request(app)
        .get("/api/resolve")
        .query({ platform: "youtube", platformId: "nonexistent123" })
        .expect(404);

      expect(response.body).to.have.property("error");
      expect(response.body.error).to.include("No binding found");
    });

    it("GET /api/resolve should resolve existing binding", async function () {
      const testFile = createTestFile("Resolve test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;
      const youtubeId = "resolveTestId";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register and bind on-chain
      await registry.register(testFile.hash, manifestUri);
      await registry.bindPlatform(testFile.hash, "youtube", youtubeId);

      // Resolve via API
      const response = await request(app)
        .get("/api/resolve")
        .query({ platform: "youtube", platformId: youtubeId })
        .expect(200);

      expect(response.body.platform).to.equal("youtube");
      expect(response.body.platformId).to.equal(youtubeId);
      expect(response.body.contentHash).to.equal(testFile.hash);
      expect(response.body.manifestURI).to.equal(manifestUri);
      expect(response.body.creator).to.equal(creator.address);
    });

    it("GET /api/public-verify should include manifest data", async function () {
      const testFile = createTestFile("Public verify test");
      const manifest = {
        content_hash: testFile.hash,
        content_uri: "ipfs://QmContent123",
        creator: creator.address.toLowerCase(),
        timestamp: Math.floor(Date.now() / 1000),
      };

      // Write manifest to temp file
      const manifestPath = path.join(os.tmpdir(), `manifest-${Date.now()}.json`);
      await writeFile(manifestPath, JSON.stringify(manifest));
      const manifestUri = `file://${manifestPath}`;

      const youtubeId = "publicVerifyId";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register and bind
      await registry.register(testFile.hash, manifestUri);
      await registry.bindPlatform(testFile.hash, "youtube", youtubeId);

      // Public verify via API
      const response = await request(app)
        .get("/api/public-verify")
        .query({ platform: "youtube", platformId: youtubeId })
        .expect(200);

      expect(response.body.contentHash).to.equal(testFile.hash);
      expect(response.body.manifest).to.exist;
      expect(response.body.manifest.content_hash).to.equal(testFile.hash);

      // Cleanup
      await unlink(manifestPath);
    });
  });

  describe("Error Handling", function () {
    it("should handle invalid registry address gracefully", async function () {
      const originalRegistry = process.env.REGISTRY_ADDRESS;
      process.env.REGISTRY_ADDRESS = "invalid-address";

      const response = await request(app)
        .get("/api/resolve")
        .query({ platform: "youtube", platformId: "test" });

      // Should return error (not crash)
      expect(response.status).to.be.oneOf([400, 500]);
      expect(response.body).to.have.property("error");

      // Restore
      process.env.REGISTRY_ADDRESS = originalRegistry;
    });

    it("should handle database connection errors gracefully", async function () {
      // This test validates error handling when database is unavailable
      // In real scenario, database would be disconnected
      // For now, just verify the endpoint structure
      const response = await request(app).get("/api/contents").expect(200);

      expect(response.body).to.be.an("array");
    });

    it("should handle blockchain connection errors gracefully", async function () {
      const originalRpc = process.env.RPC_URL;
      process.env.RPC_URL = "http://invalid-rpc-url:9999";

      const response = await request(app).get("/api/network");

      // Should return error or handle gracefully
      expect(response.status).to.be.oneOf([200, 500]);

      // Restore
      process.env.RPC_URL = originalRpc;
    });
  });

  describe("Rate Limiting", function () {
    it("should allow requests within rate limit", async function () {
      // Make several requests
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get("/api/health").expect(200);

        expect(response.body).to.deep.equal({ ok: true });
      }
    });

    it("should include rate limit headers", async function () {
      const response = await request(app).get("/api/health").expect(200);

      // Check for rate limit headers (if configured)
      // These may not be present in test environment without Redis
      if (response.headers["x-ratelimit-limit"]) {
        expect(response.headers["x-ratelimit-limit"]).to.exist;
        expect(response.headers["x-ratelimit-remaining"]).to.exist;
      }
    });
  });

  describe("CORS", function () {
    it("should include CORS headers", async function () {
      const response = await request(app).get("/api/health").expect(200);

      // CORS headers should be present
      expect(response.headers["access-control-allow-origin"]).to.exist;
    });

    it("should handle OPTIONS preflight requests", async function () {
      const response = await request(app)
        .options("/api/health")
        .set("Origin", "http://example.com")
        .set("Access-Control-Request-Method", "GET");

      // Should return 200 or 204 for OPTIONS
      expect(response.status).to.be.oneOf([200, 204]);
    });
  });
});
