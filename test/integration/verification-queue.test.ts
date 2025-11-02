/**
 * Integration tests for Verification Queue
 * Tests async verification job processing with BullMQ
 */

import { expect } from "chai";
import request from "supertest";
import { ethers } from "ethers";
import { IntegrationTestEnvironment } from "../fixtures/helpers";
import { createTestFile } from "../fixtures/factories";
import { unlink } from "fs/promises";

describe("Integration: Verification Queue", function () {
  this.timeout(60000); // Increase timeout for queue processing

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

    // Note: These tests work with or without Redis
    // If REDIS_URL is not set, they test synchronous fallback mode

    app = env.server.getApp();
  });

  after(async function () {
    await env.teardown();
  });

  afterEach(async function () {
    await env.cleanup();
  });

  describe("Async Verification Endpoints", function () {
    it("POST /api/verification-jobs/verify should enqueue or process synchronously", async function () {
      // Create test file and manifest
      const { filePath } = await createTestFile();

      try {
        // Upload and register content first
        const uploadResponse = await request(app)
          .post("/api/upload")
          .set("x-api-key", process.env.API_KEY || "")
          .attach("file", filePath)
          .expect(200);

        const contentUri = uploadResponse.body.uri;

        // Create and upload manifest
        const manifestResponse = await request(app)
          .post("/api/manifest")
          .set("x-api-key", process.env.API_KEY || "")
          .attach("file", filePath)
          .field("contentUri", contentUri)
          .field("upload", "true")
          .expect(200);

        const actualManifestUri = manifestResponse.body.uri;

        // Register on-chain
        await request(app)
          .post("/api/register")
          .set("x-api-key", process.env.API_KEY || "")
          .attach("file", filePath)
          .field("registryAddress", registryAddress)
          .field("manifestURI", actualManifestUri)
          .expect(200);

        // Now test verification
        const verifyResponse = await request(app)
          .post("/api/verification-jobs/verify")
          .attach("file", filePath)
          .field("registryAddress", registryAddress)
          .field("manifestURI", actualManifestUri)
          .expect(200);

        if (verifyResponse.body.mode === "async") {
          // Redis is available, job was queued
          expect(verifyResponse.body).to.have.property("jobId");
          expect(verifyResponse.body).to.have.property("pollUrl");
          expect(verifyResponse.body.status).to.equal("queued");

          // Poll for job completion
          const jobId = verifyResponse.body.jobId;
          let completed = false;
          let attempts = 0;
          const maxAttempts = 30; // 30 seconds max wait

          while (!completed && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

            const statusResponse = await request(app)
              .get(`/api/verification-jobs/${jobId}`)
              .expect(200);

            if (statusResponse.body.status === "completed") {
              completed = true;
              expect(statusResponse.body).to.have.property("result");
              expect(statusResponse.body.result).to.have.property("status");
              expect(statusResponse.body.result.status).to.be.oneOf(["OK", "WARN"]);
            } else if (statusResponse.body.status === "failed") {
              throw new Error(`Job failed: ${statusResponse.body.error}`);
            }

            attempts++;
          }

          expect(completed).to.be.true;
        } else {
          // Synchronous fallback mode
          expect(verifyResponse.body.mode).to.equal("sync");
          expect(verifyResponse.body).to.have.property("result");
          expect(verifyResponse.body.result).to.have.property("status");
          expect(verifyResponse.body.result.status).to.be.oneOf(["OK", "WARN"]);
        }
      } finally {
        await unlink(filePath).catch(() => {});
      }
    });

    it("POST /api/verification-jobs/proof should enqueue or process synchronously", async function () {
      // Create test file
      const { filePath } = await createTestFile();

      try {
        // Upload and register content first
        const uploadResponse = await request(app)
          .post("/api/upload")
          .set("x-api-key", process.env.API_KEY || "")
          .attach("file", filePath)
          .expect(200);

        const contentUri = uploadResponse.body.uri;

        // Create and upload manifest
        const manifestResponse = await request(app)
          .post("/api/manifest")
          .set("x-api-key", process.env.API_KEY || "")
          .attach("file", filePath)
          .field("contentUri", contentUri)
          .field("upload", "true")
          .expect(200);

        const actualManifestUri = manifestResponse.body.uri;

        // Register on-chain
        await request(app)
          .post("/api/register")
          .set("x-api-key", process.env.API_KEY || "")
          .attach("file", filePath)
          .field("registryAddress", registryAddress)
          .field("manifestURI", actualManifestUri)
          .expect(200);

        // Now test proof generation
        const proofResponse = await request(app)
          .post("/api/verification-jobs/proof")
          .attach("file", filePath)
          .field("registryAddress", registryAddress)
          .field("manifestURI", actualManifestUri)
          .expect(200);

        if (proofResponse.body.mode === "async") {
          // Redis is available, job was queued
          expect(proofResponse.body).to.have.property("jobId");
          expect(proofResponse.body).to.have.property("pollUrl");

          // Poll for job completion
          const jobId = proofResponse.body.jobId;
          let completed = false;
          let attempts = 0;
          const maxAttempts = 30;

          while (!completed && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const statusResponse = await request(app)
              .get(`/api/verification-jobs/${jobId}`)
              .expect(200);

            if (statusResponse.body.status === "completed") {
              completed = true;
              expect(statusResponse.body).to.have.property("result");
              expect(statusResponse.body.result).to.have.property("verification");
              expect(statusResponse.body.result.verification.status).to.be.oneOf(["OK", "WARN"]);
            } else if (statusResponse.body.status === "failed") {
              throw new Error(`Job failed: ${statusResponse.body.error}`);
            }

            attempts++;
          }

          expect(completed).to.be.true;
        } else {
          // Synchronous fallback mode
          expect(proofResponse.body.mode).to.equal("sync");
          expect(proofResponse.body).to.have.property("result");
          expect(proofResponse.body.result).to.have.property("verification");
          expect(proofResponse.body.result.verification.status).to.be.oneOf(["OK", "WARN"]);
        }
      } finally {
        await unlink(filePath).catch(() => {});
      }
    });

    it("GET /api/verification-jobs/:jobId should return 404 for non-existent job", async function () {
      await request(app).get("/api/verification-jobs/nonexistent").expect(404);
    });

    it("GET /api/verification-jobs should list jobs", async function () {
      const response = await request(app).get("/api/verification-jobs").expect(200);

      expect(response.body).to.have.property("jobs");
      expect(response.body.jobs).to.be.an("array");
    });

    it("GET /api/verification-jobs/stats should return queue statistics", async function () {
      const response = await request(app).get("/api/verification-jobs/stats").expect(200);

      expect(response.body).to.have.property("available");
      if (response.body.available) {
        expect(response.body).to.have.property("waiting");
        expect(response.body).to.have.property("active");
        expect(response.body).to.have.property("completed");
        expect(response.body).to.have.property("failed");
      }
    });
  });

  describe("Synchronous Fallback", function () {
    it("should handle verification when Redis is unavailable", async function () {
      // This test validates the sync fallback behavior
      // The actual mode depends on whether REDIS_URL is set

      const { filePath } = await createTestFile();

      try {
        // Upload and register content
        const uploadResponse = await request(app)
          .post("/api/upload")
          .set("x-api-key", process.env.API_KEY || "")
          .attach("file", filePath)
          .expect(200);

        const contentUri = uploadResponse.body.uri;

        const manifestResponse = await request(app)
          .post("/api/manifest")
          .set("x-api-key", process.env.API_KEY || "")
          .attach("file", filePath)
          .field("contentUri", contentUri)
          .field("upload", "true")
          .expect(200);

        const actualManifestUri = manifestResponse.body.uri;

        await request(app)
          .post("/api/register")
          .set("x-api-key", process.env.API_KEY || "")
          .attach("file", filePath)
          .field("registryAddress", registryAddress)
          .field("manifestURI", actualManifestUri)
          .expect(200);

        // Verify - should work regardless of Redis availability
        const verifyResponse = await request(app)
          .post("/api/verification-jobs/verify")
          .attach("file", filePath)
          .field("registryAddress", registryAddress)
          .field("manifestURI", actualManifestUri)
          .expect(200);

        // Should have a mode property indicating sync or async
        expect(verifyResponse.body).to.have.property("mode");
        expect(verifyResponse.body.mode).to.be.oneOf(["sync", "async"]);
      } finally {
        await unlink(filePath).catch(() => {});
      }
    });
  });
});
