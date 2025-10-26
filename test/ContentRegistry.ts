import { expect } from "chai";
import { ethers } from "hardhat";

describe("ContentRegistry", function () {
  it("registers and reads entry", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("hello"));
    const uri = "ipfs://cid/manifest.json";

    await expect(registry.connect(creator).register(hash, uri)).to.emit(
      registry,
      "ContentRegistered"
    );

    const entry = await registry.entries(hash);
    expect(entry.creator).to.eq(creator.address);
    expect(entry.manifestURI).to.eq(uri);
  });

  it("prevents duplicate registration", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";

    // First registration should succeed
    await registry.connect(creator).register(hash, uri);

    // Second registration should fail
    await expect(registry.connect(creator).register(hash, uri)).to.be.revertedWith(
      "Already registered"
    );
  });

  it("prevents non-creator from updating manifest", async function () {
    const [creator, nonCreator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";
    const newUri = "ipfs://QmNewTest/manifest.json";

    // Register content
    await registry.connect(creator).register(hash, uri);

    // Non-creator should not be able to update
    await expect(registry.connect(nonCreator).updateManifest(hash, newUri)).to.be.revertedWith(
      "Not creator"
    );
  });

  it("allows creator to update manifest", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";
    const newUri = "ipfs://QmNewTest/manifest.json";

    // Register and update
    await registry.connect(creator).register(hash, uri);

    // Get the update transaction and check event
    const updateTx = await registry.connect(creator).updateManifest(hash, newUri);
    const updateReceipt = await updateTx.wait();
    const updateBlock = await ethers.provider.getBlock(updateReceipt!.blockNumber);

    await expect(updateTx)
      .to.emit(registry, "ManifestUpdated")
      .withArgs(hash, newUri, updateBlock!.timestamp);

    // Verify update
    const entry = await registry.entries(hash);
    expect(entry.manifestURI).to.eq(newUri);
  });

  it("prevents non-creator from revoking", async function () {
    const [creator, nonCreator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";

    // Register content
    await registry.connect(creator).register(hash, uri);

    // Non-creator should not be able to revoke
    await expect(registry.connect(nonCreator).revoke(hash)).to.be.revertedWith("Not creator");
  });

  it("allows creator to revoke content", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";

    // Register and revoke
    await registry.connect(creator).register(hash, uri);
    await expect(registry.connect(creator).revoke(hash)).to.emit(registry, "EntryRevoked");

    // Verify revocation (manifest should be empty)
    const entry = await registry.entries(hash);
    expect(entry.manifestURI).to.eq("");
    expect(entry.creator).to.eq(creator.address); // Creator info preserved
  });

  it("prevents non-creator from binding platform", async function () {
    const [creator, nonCreator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";

    // Register content
    await registry.connect(creator).register(hash, uri);

    // Non-creator should not be able to bind
    await expect(
      registry.connect(nonCreator).bindPlatform(hash, "youtube", "test-video-id")
    ).to.be.revertedWith("Not creator");
  });

  it("allows creator to bind platform and resolves correctly", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";
    const platform = "youtube";
    const platformId = "dQw4w9WgXcQ";

    // Register and bind
    await registry.connect(creator).register(hash, uri);
    await expect(registry.connect(creator).bindPlatform(hash, platform, platformId))
      .to.emit(registry, "PlatformBound")
      .withArgs(hash, platform, platformId);

    // Resolve by platform
    const [resolvedCreator, resolvedHash, resolvedUri] = await registry.resolveByPlatform(
      platform,
      platformId
    );

    expect(resolvedCreator).to.eq(creator.address);
    expect(resolvedHash).to.eq(hash);
    expect(resolvedUri).to.eq(uri);
  });

  it("prevents duplicate platform binding", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";
    const platform = "youtube";
    const platformId = "test-video-id";

    // Register and bind
    await registry.connect(creator).register(hash, uri);
    await registry.connect(creator).bindPlatform(hash, platform, platformId);

    // Try to bind same platform+id again
    await expect(
      registry.connect(creator).bindPlatform(hash, platform, platformId)
    ).to.be.revertedWith("Already bound");
  });

  it("allows binding multiple platforms to same content", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";

    // Register content
    await registry.connect(creator).register(hash, uri);

    // Bind multiple platforms
    await registry.connect(creator).bindPlatform(hash, "youtube", "video-123");
    await registry.connect(creator).bindPlatform(hash, "twitter", "tweet-456");
    await registry.connect(creator).bindPlatform(hash, "tiktok", "tiktok-789");

    // Verify each resolves correctly
    const [, ytHash] = await registry.resolveByPlatform("youtube", "video-123");
    const [, twHash] = await registry.resolveByPlatform("twitter", "tweet-456");
    const [, ttHash] = await registry.resolveByPlatform("tiktok", "tiktok-789");

    expect(ytHash).to.eq(hash);
    expect(twHash).to.eq(hash);
    expect(ttHash).to.eq(hash);
  });

  it("returns empty values for non-existent platform binding", async function () {
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    // Query non-existent binding
    const [resolvedCreator, resolvedContentHash, resolvedManifestURI, resolvedTimestamp] =
      await registry.resolveByPlatform("youtube", "nonexistent");

    expect(resolvedCreator).to.eq(ethers.ZeroAddress);
    expect(resolvedContentHash).to.eq(ethers.ZeroHash);
    expect(resolvedManifestURI).to.eq("");
    expect(resolvedTimestamp).to.eq(0);
  });

  it("emits correct events with parameters", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
    const uri = "ipfs://QmTest/manifest.json";

    // Check ContentRegistered event
    const tx = await registry.connect(creator).register(hash, uri);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt!.blockNumber);

    await expect(tx)
      .to.emit(registry, "ContentRegistered")
      .withArgs(hash, creator.address, uri, block!.timestamp);
  });
});
