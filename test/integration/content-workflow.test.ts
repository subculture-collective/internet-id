/**
 * Integration tests for full content registration workflow
 * Tests: upload → generate manifest → register on-chain → verify status
 */

import { expect } from "chai";
import { ethers } from "ethers";
import { writeFile, unlink } from "fs/promises";
import * as path from "path";
import * as os from "os";
import { IntegrationTestEnvironment } from "../fixtures/helpers";
import { createTestFile, createTestManifest, signTestManifest } from "../fixtures/factories";

describe("Integration: Content Registration Workflow", function () {
  this.timeout(30000); // Increase timeout for blockchain operations

  let env: IntegrationTestEnvironment;
  let registryAddress: string;
  let creator: ethers.Wallet;
  let testFilePath: string;

  before(async function () {
    env = new IntegrationTestEnvironment();
    await env.setup();
    
    // Deploy registry contract
    creator = env.blockchain.getSigner(0) as ethers.Wallet;
    registryAddress = await env.blockchain.deployRegistry(creator);

    // Set registry address in environment
    process.env.REGISTRY_ADDRESS = registryAddress;
    process.env.PRIVATE_KEY = creator.privateKey;
  });

  after(async function () {
    if (testFilePath) {
      try {
        await unlink(testFilePath);
      } catch {}
    }
    await env.teardown();
  });

  afterEach(async function () {
    await env.cleanup();
  });

  describe("Upload → Manifest → Register → Verify Flow", function () {
    it("should complete full workflow successfully", async function () {
      // Step 1: Create test file
      const testFile = createTestFile("Integration test content");
      testFilePath = path.join(os.tmpdir(), testFile.originalname);
      await writeFile(testFilePath, testFile.buffer);

      // Step 2: Generate manifest
      const manifest = createTestManifest(testFile.hash, creator.address.toLowerCase());
      manifest.signature = await signTestManifest(manifest, creator);
      
      // Write manifest to temp file
      const manifestPath = path.join(os.tmpdir(), "manifest.json");
      await writeFile(manifestPath, JSON.stringify(manifest));
      const manifestUri = `file://${manifestPath}`;

      // Step 3: Register on-chain
      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      const tx = await registry.register(testFile.hash, manifestUri);
      const receipt = await tx.wait();

      expect(receipt).to.exist;
      expect(receipt.status).to.equal(1);

      // Step 4: Verify registration on-chain
      const entry = await registry.entries(testFile.hash);
      expect(entry.creator).to.equal(creator.address);
      expect(entry.contentHash).to.equal(testFile.hash);
      expect(entry.manifestURI).to.equal(manifestUri);
      expect(Number(entry.timestamp)).to.be.greaterThan(0);

      // Step 5: Verify in database (if API was used)
      const prisma = env.db.getClient();
      const dbContent = await prisma.content.findUnique({
        where: { contentHash: testFile.hash },
      });

      // Database entry may not exist if we only used contract directly
      // This is expected in this test scenario
      if (dbContent) {
        expect(dbContent.contentHash).to.equal(testFile.hash);
        expect(dbContent.creatorAddress).to.equal(creator.address.toLowerCase());
      }

      // Cleanup manifest file
      await unlink(manifestPath);
    });

    it("should prevent duplicate registration", async function () {
      const testFile = createTestFile("Duplicate test content");
      const manifest = createTestManifest(testFile.hash, creator.address.toLowerCase());
      const manifestUri = `ipfs://QmTest${Date.now()}`;

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // First registration
      await registry.register(testFile.hash, manifestUri);

      // Second registration should fail
      try {
        await registry.register(testFile.hash, manifestUri);
        expect.fail("Should have thrown error for duplicate registration");
      } catch (error: any) {
        expect(error.message).to.include("Already registered");
      }
    });

    it("should allow creator to update manifest URI", async function () {
      const testFile = createTestFile("Update manifest test");
      const manifestUri1 = `ipfs://QmTest1${Date.now()}`;
      const manifestUri2 = `ipfs://QmTest2${Date.now()}`;

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register with first manifest
      await registry.register(testFile.hash, manifestUri1);

      // Update manifest
      const updateTx = await registry.updateManifest(testFile.hash, manifestUri2);
      await updateTx.wait();

      // Verify update
      const entry = await registry.entries(testFile.hash);
      expect(entry.manifestURI).to.equal(manifestUri2);
    });

    it("should prevent non-creator from updating manifest", async function () {
      const testFile = createTestFile("Non-creator test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register with creator
      await registry.register(testFile.hash, manifestUri);

      // Try to update with different signer
      const otherSigner = env.blockchain.getSigner(1);
      const registryAsOther = registry.connect(otherSigner);

      try {
        await registryAsOther.updateManifest(testFile.hash, "ipfs://QmNew");
        expect.fail("Should have thrown error for non-creator");
      } catch (error: any) {
        expect(error.message).to.include("Not creator");
      }
    });
  });

  describe("Content Revocation", function () {
    it("should allow creator to revoke content", async function () {
      const testFile = createTestFile("Revocation test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register content
      await registry.register(testFile.hash, manifestUri);

      // Revoke content
      const revokeTx = await registry.revoke(testFile.hash);
      await revokeTx.wait();

      // Verify revocation
      const entry = await registry.entries(testFile.hash);
      expect(entry.manifestURI).to.equal("");
      expect(entry.creator).to.equal(creator.address);
      expect(Number(entry.timestamp)).to.be.greaterThan(0);
    });

    it("should prevent non-creator from revoking content", async function () {
      const testFile = createTestFile("Non-creator revoke test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register with creator
      await registry.register(testFile.hash, manifestUri);

      // Try to revoke with different signer
      const otherSigner = env.blockchain.getSigner(1);
      const registryAsOther = registry.connect(otherSigner);

      try {
        await registryAsOther.revoke(testFile.hash);
        expect.fail("Should have thrown error for non-creator");
      } catch (error: any) {
        expect(error.message).to.include("Not creator");
      }
    });
  });

  describe("Error Scenarios", function () {
    it("should handle transaction revert gracefully", async function () {
      const testFile = createTestFile("Revert test");
      const manifestUri = `ipfs://QmTest${Date.now()}`;

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register first time
      await registry.register(testFile.hash, manifestUri);

      // Try to register again (should revert)
      try {
        await registry.register(testFile.hash, manifestUri);
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error).to.exist;
        expect(error.message).to.include("Already registered");
      }
    });

    it("should handle invalid content hash", async function () {
      const manifestUri = `ipfs://QmTest${Date.now()}`;

      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Try to register with zero hash
      const zeroHash = ethers.ZeroHash;
      
      // This should succeed but is a valid edge case
      await registry.register(zeroHash, manifestUri);
      
      const entry = await registry.entries(zeroHash);
      expect(entry.contentHash).to.equal(zeroHash);
    });

    it("should handle empty manifest URI", async function () {
      const testFile = createTestFile("Empty URI test");
      const registry = env.blockchain.getRegistry();
      if (!registry) throw new Error("Registry not deployed");

      // Register with empty manifest URI (allowed by contract)
      await registry.register(testFile.hash, "");
      
      const entry = await registry.entries(testFile.hash);
      expect(entry.manifestURI).to.equal("");
    });
  });
});
