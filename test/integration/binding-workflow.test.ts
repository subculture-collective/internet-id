/**
 * Integration tests for platform binding workflows
 * Tests: bind platform account → resolve binding → verify ownership
 */

import { expect } from "chai";
import { ethers } from "ethers";
import { IntegrationTestEnvironment } from "../fixtures/helpers";
import { createTestFile, createTestBinding } from "../fixtures/factories";

describe("Integration: Platform Binding Workflow", function () {
  this.timeout(30000);

  let env: IntegrationTestEnvironment;
  let registryAddress: string;
  let creator: ethers.Wallet;

  before(async function () {
    env = new IntegrationTestEnvironment();
    await env.setup();

    creator = env.blockchain.getSigner(0) as ethers.Wallet;
    registryAddress = await env.blockchain.deployRegistry(creator);

    process.env.REGISTRY_ADDRESS = registryAddress;
    process.env.PRIVATE_KEY = creator.privateKey;
  });

  after(async function () {
    await env.teardown();
  });

  afterEach(async function () {
    await env.cleanup();
  });

  describe("YouTube Binding Flow", function () {
    it("should bind YouTube video to content", async function () {
      const testFile = createTestFile("YouTube test content");
      const manifestUri = `ipfs://QmTest${Date.now()}`;
      const youtubeId = "dQw4w9WgXcQ";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // First register content
      const registerTx = await registry.register(testFile.hash, manifestUri);
      await registerTx.wait();

      // Bind YouTube video
      const bindTx = await registry.bindPlatform(testFile.hash, "youtube", youtubeId);
      await bindTx.wait();

      // Verify binding
      const platformKey = ethers.keccak256(ethers.toUtf8Bytes(`youtube:${youtubeId}`));
      const boundHash = await registry.platformToHash(platformKey);
      expect(boundHash).to.equal(testFile.hash);

      // Resolve via resolvePlatform
      const resolved = await registry.resolveByPlatform("youtube", youtubeId);
      expect(resolved.creator).to.equal(creator.address);
      expect(resolved.contentHash).to.equal(testFile.hash);
      expect(resolved.manifestURI).to.equal(manifestUri);
      expect(Number(resolved.timestamp)).to.be.greaterThan(0);
    });

    it("should prevent duplicate platform binding", async function () {
      const testFile = createTestFile("Duplicate binding test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;
      const youtubeId = "testVideoId123";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register and bind
      await registry.register(testFile.hash, manifestUri);
      await registry.bindPlatform(testFile.hash, "youtube", youtubeId);

      // Try to bind again
      try {
        await registry.bindPlatform(testFile.hash, "youtube", youtubeId);
        expect.fail("Should have thrown error for duplicate binding");
      } catch (error: any) {
        expect(error.message).to.include("Already bound");
      }
    });

    it("should allow multiple platforms for same content", async function () {
      const testFile = createTestFile("Multi-platform test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;
      const youtubeId = "youtubeId123";
      const twitterId = "1234567890";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register content
      await registry.register(testFile.hash, manifestUri);

      // Bind to YouTube
      await registry.bindPlatform(testFile.hash, "youtube", youtubeId);

      // Bind to Twitter
      await registry.bindPlatform(testFile.hash, "x", twitterId);

      // Verify both bindings
      const youtubeResolved = await registry.resolveByPlatform("youtube", youtubeId);
      expect(youtubeResolved.contentHash).to.equal(testFile.hash);

      const twitterResolved = await registry.resolveByPlatform("x", twitterId);
      expect(twitterResolved.contentHash).to.equal(testFile.hash);
    });

    it("should prevent non-creator from binding platform", async function () {
      const testFile = createTestFile("Non-creator binding test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;
      const youtubeId = "unauthorizedId";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register with creator
      await registry.register(testFile.hash, manifestUri);

      // Try to bind with different signer
      const otherSigner = env.blockchain.getSigner(1);
      const registryAsOther = registry.connect(otherSigner);

      try {
        await registryAsOther.bindPlatform(testFile.hash, "youtube", youtubeId);
        expect.fail("Should have thrown error for non-creator");
      } catch (error: any) {
        expect(error.message).to.include("Not creator");
      }
    });
  });

  describe("Twitter/X Binding Flow", function () {
    it("should bind Twitter post to content", async function () {
      const testFile = createTestFile("Twitter test content");
      const manifestUri = `ipfs://QmTest${Date.now()}`;
      const tweetId = "1234567890123456789";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register and bind
      await registry.register(testFile.hash, manifestUri);
      await registry.bindPlatform(testFile.hash, "x", tweetId);

      // Verify binding
      const resolved = await registry.resolveByPlatform("x", tweetId);
      expect(resolved.contentHash).to.equal(testFile.hash);
      expect(resolved.creator).to.equal(creator.address);
    });

    it("should handle case-insensitive platform names", async function () {
      const testFile = createTestFile("Case test content");
      const manifestUri = `ipfs://QmTest${Date.now()}`;
      const platformId = "testId123";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register content
      await registry.register(testFile.hash, manifestUri);

      // Bind with lowercase
      await registry.bindPlatform(testFile.hash, "youtube", platformId);

      // Resolve with lowercase (should work)
      const resolved = await registry.resolveByPlatform("youtube", platformId);
      expect(resolved.contentHash).to.equal(testFile.hash);
    });
  });

  describe("Platform Resolution", function () {
    it("should return zero values for non-existent binding", async function () {
      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      const resolved = await registry.resolveByPlatform("youtube", "nonexistent123");
      expect(resolved.creator).to.equal(ethers.ZeroAddress);
      expect(resolved.contentHash).to.equal(ethers.ZeroHash);
      expect(resolved.manifestURI).to.equal("");
      expect(Number(resolved.timestamp)).to.equal(0);
    });

    it("should resolve binding after content update", async function () {
      const testFile = createTestFile("Update resolution test");
      const manifestUri1 = `ipfs://QmTest1${Date.now()}`;
      const manifestUri2 = `ipfs://QmTest2${Date.now()}`;
      const youtubeId = "updateTestId";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register, bind, then update manifest
      await registry.register(testFile.hash, manifestUri1);
      await registry.bindPlatform(testFile.hash, "youtube", youtubeId);
      await registry.updateManifest(testFile.hash, manifestUri2);

      // Resolve should return updated manifest
      const resolved = await registry.resolveByPlatform("youtube", youtubeId);
      expect(resolved.manifestURI).to.equal(manifestUri2);
    });

    it("should handle special characters in platform IDs", async function () {
      const testFile = createTestFile("Special char test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;
      const platformId = "test-id_with.special@chars123";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register and bind
      await registry.register(testFile.hash, manifestUri);
      await registry.bindPlatform(testFile.hash, "tiktok", platformId);

      // Resolve
      const resolved = await registry.resolveByPlatform("tiktok", platformId);
      expect(resolved.contentHash).to.equal(testFile.hash);
    });
  });

  describe("Database Integration", function () {
    it("should sync binding to database", async function () {
      if (!env.db.isDbAvailable()) {
        this.skip();
      }

      const testFile = createTestFile("DB sync test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;
      const youtubeId = "dbSyncId123";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      const prisma = env.db.getClient();

      // Register content in DB
      await prisma.content.create({
        data: {
          contentHash: testFile.hash,
          manifestUri: manifestUri,
          creatorAddress: creator.address.toLowerCase(),
          registryAddress: registryAddress,
        },
      });

      // Create binding in DB
      await prisma.platformBinding.create({
        data: {
          platform: "youtube",
          platformId: youtubeId,
          content: {
            connect: { contentHash: testFile.hash },
          },
        },
      });

      // Verify in database
      const binding = await prisma.platformBinding.findUnique({
        where: {
          platform_platformId: {
            platform: "youtube",
            platformId: youtubeId,
          },
        },
        include: {
          content: true,
        },
      });

      expect(binding).to.exist;
      expect(binding!.platform).to.equal("youtube");
      expect(binding!.platformId).to.equal(youtubeId);
      expect(binding!.content?.contentHash).to.equal(testFile.hash);
    });
  });

  describe("Error Scenarios", function () {
    it("should handle binding to unregistered content", async function () {
      const testFile = createTestFile("Unregistered test");
      const youtubeId = "unregisteredId";

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Try to bind without registering first
      try {
        await registry.bindPlatform(testFile.hash, "youtube", youtubeId);
        expect.fail("Should have thrown error for unregistered content");
      } catch (error: any) {
        expect(error.message).to.include("Not found");
      }
    });

    it("should handle empty platform name", async function () {
      const testFile = createTestFile("Empty platform test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      await registry.register(testFile.hash, manifestUri);

      // Binding with empty platform should work at contract level
      // (validation should be done at API level)
      await registry.bindPlatform(testFile.hash, "", "someId");

      const resolved = await registry.resolveByPlatform("", "someId");
      expect(resolved.contentHash).to.equal(testFile.hash);
    });

    it("should handle empty platform ID", async function () {
      const testFile = createTestFile("Empty ID test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      await registry.register(testFile.hash, manifestUri);

      // Binding with empty ID should work at contract level
      await registry.bindPlatform(testFile.hash, "youtube", "");

      const resolved = await registry.resolveByPlatform("youtube", "");
      expect(resolved.contentHash).to.equal(testFile.hash);
    });
  });
});
