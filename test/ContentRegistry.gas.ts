import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * Gas Regression Tests for ContentRegistry
 * 
 * These tests ensure that gas optimizations are maintained over time.
 * If these tests fail, it means the gas usage has increased and should be investigated.
 * 
 * BASELINE GAS USAGE (after optimization):
 * - Deployment: ~825,317 gas
 * - register: 50,368 - 115,935 gas (avg: ~71,650)
 * - bindPlatform: 78,228 - 95,640 gas (avg: ~92,690)
 * - updateManifest: ~33,245 gas
 * - revoke: ~26,407 gas
 */
describe("Gas Regression Tests", function () {
  const MAX_DEPLOYMENT_GAS = 850000;
  const MAX_REGISTER_SHORT_URI_GAS = 73000; // Actual: ~70,846 gas
  const MAX_REGISTER_LONG_URI_GAS = 145000; // Actual: ~138,948 gas (varies with URI length)
  const MAX_BIND_PLATFORM_GAS = 100000;
  const MAX_UPDATE_MANIFEST_GAS = 35000;
  const MAX_REVOKE_GAS = 28000;

  it("deployment gas should not exceed baseline", async function () {
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    const deployReceipt = await registry.deploymentTransaction()?.wait();
    
    const gasUsed = deployReceipt?.gasUsed || 0n;
    expect(gasUsed).to.be.lessThan(MAX_DEPLOYMENT_GAS);
  });

  it("register gas should not exceed baseline (short URI)", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest";

    const tx = await registry.connect(creator).register(hash, uri);
    const receipt = await tx.wait();
    const gasUsed = receipt?.gasUsed || 0n;

    expect(gasUsed).to.be.lessThan(MAX_REGISTER_SHORT_URI_GAS);
  });

  it("register gas should not exceed baseline (long URI)", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content-long"));
    // Longer URI to test upper bound
    const uri = "ipfs://QmTestLongHashHere1234567890abcdefghijklmnopqrstuvwxyz/manifest.json";

    const tx = await registry.connect(creator).register(hash, uri);
    const receipt = await tx.wait();
    const gasUsed = receipt?.gasUsed || 0n;

    expect(gasUsed).to.be.lessThan(MAX_REGISTER_LONG_URI_GAS);
  });

  it("bindPlatform gas should not exceed baseline", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";
    
    await registry.connect(creator).register(hash, uri);

    const tx = await registry.connect(creator).bindPlatform(hash, "youtube", "dQw4w9WgXcQ");
    const receipt = await tx.wait();
    const gasUsed = receipt?.gasUsed || 0n;

    expect(gasUsed).to.be.lessThan(MAX_BIND_PLATFORM_GAS);
  });

  it("updateManifest gas should not exceed baseline", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";
    const newUri = "ipfs://QmNewTest/manifest.json";
    
    await registry.connect(creator).register(hash, uri);

    const tx = await registry.connect(creator).updateManifest(hash, newUri);
    const receipt = await tx.wait();
    const gasUsed = receipt?.gasUsed || 0n;

    expect(gasUsed).to.be.lessThan(MAX_UPDATE_MANIFEST_GAS);
  });

  it("revoke gas should not exceed baseline", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";
    
    await registry.connect(creator).register(hash, uri);

    const tx = await registry.connect(creator).revoke(hash);
    const receipt = await tx.wait();
    const gasUsed = receipt?.gasUsed || 0n;

    expect(gasUsed).to.be.lessThan(MAX_REVOKE_GAS);
  });
});
