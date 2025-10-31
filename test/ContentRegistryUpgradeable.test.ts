import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { ContentRegistryV1, ContentRegistryV2 } from "../typechain-types";

describe("ContentRegistry - Upgradeable Pattern", function () {
  describe("Deployment and Initialization", function () {
    it("deploys proxy and implementation correctly", async function () {
      const [owner] = await ethers.getSigners();
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      
      const proxy = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxy.waitForDeployment();
      
      const proxyAddress = await proxy.getAddress();
      const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
      
      expect(proxyAddress).to.be.properAddress;
      expect(implementationAddress).to.be.properAddress;
      expect(proxyAddress).to.not.equal(implementationAddress);
    });

    it("initializes with correct owner", async function () {
      const [owner] = await ethers.getSigners();
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      
      const proxy = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxy.waitForDeployment();
      
      expect(await proxy.owner()).to.equal(owner.address);
    });

    it("reports correct version", async function () {
      const [owner] = await ethers.getSigners();
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      
      const proxy = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxy.waitForDeployment();
      
      expect(await proxy.version()).to.equal("1.0.0");
    });

    it("prevents reinitialization", async function () {
      const [owner, other] = await ethers.getSigners();
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      
      const proxy = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxy.waitForDeployment();
      
      await expect(proxy.initialize(other.address)).to.be.revertedWithCustomError(
        proxy,
        "InvalidInitialization"
      );
    });
  });

  describe("V1 Functionality", function () {
    let proxy: any;
    let owner: any;
    let user1: any;

    beforeEach(async function () {
      [owner, user1] = await ethers.getSigners();
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      proxy = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxy.waitForDeployment();
    });

    it("allows content registration", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
      const uri = "ipfs://QmTest/manifest.json";
      
      await expect(proxy.connect(user1).register(hash, uri))
        .to.emit(proxy, "ContentRegistered");
      
      const entry = await proxy.entries(hash);
      expect(entry.creator).to.equal(user1.address);
      expect(entry.manifestURI).to.equal(uri);
    });

    it("allows manifest updates by creator", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
      const uri = "ipfs://QmTest/manifest.json";
      const newUri = "ipfs://QmNewTest/manifest.json";
      
      await proxy.connect(user1).register(hash, uri);
      await expect(proxy.connect(user1).updateManifest(hash, newUri))
        .to.emit(proxy, "ManifestUpdated");
      
      const entry = await proxy.entries(hash);
      expect(entry.manifestURI).to.equal(newUri);
    });

    it("allows platform binding", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test-content"));
      const uri = "ipfs://QmTest/manifest.json";
      
      await proxy.connect(user1).register(hash, uri);
      await expect(proxy.connect(user1).bindPlatform(hash, "youtube", "vid123"))
        .to.emit(proxy, "PlatformBound");
      
      const [creator, contentHash] = await proxy.resolveByPlatform("youtube", "vid123");
      expect(creator).to.equal(user1.address);
      expect(contentHash).to.equal(hash);
    });
  });

  describe("Storage Layout Preservation", function () {
    it("preserves storage across upgrade", async function () {
      const [owner, user1] = await ethers.getSigners();
      
      // Deploy V1
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      const proxyV1 = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxyV1.waitForDeployment();
      const proxyAddress = await proxyV1.getAddress();
      
      // Register content in V1
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("content-1"));
      const uri1 = "ipfs://Qm1234/manifest.json";
      await proxyV1.connect(user1).register(hash1, uri1);
      
      const entry1Before = await proxyV1.entries(hash1);
      const ownerBefore = await proxyV1.owner();
      
      // Upgrade to V2
      const ContentRegistryV2 = await ethers.getContractFactory("ContentRegistryV2");
      const proxyV2 = await upgrades.upgradeProxy(proxyAddress, ContentRegistryV2);
      await proxyV2.waitForDeployment();
      
      // Check storage preserved
      const entry1After = await proxyV2.entries(hash1);
      const ownerAfter = await proxyV2.owner();
      
      expect(entry1After.creator).to.equal(entry1Before.creator);
      expect(entry1After.manifestURI).to.equal(entry1Before.manifestURI);
      expect(entry1After.timestamp).to.equal(entry1Before.timestamp);
      expect(ownerAfter).to.equal(ownerBefore);
    });

    it("preserves platform bindings across upgrade", async function () {
      const [owner, user1] = await ethers.getSigners();
      
      // Deploy V1 and create binding
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      const proxyV1 = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxyV1.waitForDeployment();
      const proxyAddress = await proxyV1.getAddress();
      
      const hash = ethers.keccak256(ethers.toUtf8Bytes("content"));
      const uri = "ipfs://Qm/manifest.json";
      await proxyV1.connect(user1).register(hash, uri);
      await proxyV1.connect(user1).bindPlatform(hash, "youtube", "video123");
      
      const [creatorBefore, hashBefore] = await proxyV1.resolveByPlatform("youtube", "video123");
      
      // Upgrade to V2
      const ContentRegistryV2 = await ethers.getContractFactory("ContentRegistryV2");
      const proxyV2 = await upgrades.upgradeProxy(proxyAddress, ContentRegistryV2);
      await proxyV2.waitForDeployment();
      
      // Check binding preserved
      const [creatorAfter, hashAfter] = await proxyV2.resolveByPlatform("youtube", "video123");
      expect(creatorAfter).to.equal(creatorBefore);
      expect(hashAfter).to.equal(hashBefore);
    });

    it("maintains proxy address across upgrade", async function () {
      const [owner] = await ethers.getSigners();
      
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      const proxyV1 = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxyV1.waitForDeployment();
      const proxyAddressBefore = await proxyV1.getAddress();
      
      const ContentRegistryV2 = await ethers.getContractFactory("ContentRegistryV2");
      const proxyV2 = await upgrades.upgradeProxy(proxyAddressBefore, ContentRegistryV2);
      await proxyV2.waitForDeployment();
      const proxyAddressAfter = await proxyV2.getAddress();
      
      expect(proxyAddressAfter).to.equal(proxyAddressBefore);
    });
  });

  describe("Function Selector Compatibility", function () {
    it("V1 functions work after upgrade to V2", async function () {
      const [owner, user1] = await ethers.getSigners();
      
      // Deploy and upgrade
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      const proxyV1 = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxyV1.waitForDeployment();
      const proxyAddress = await proxyV1.getAddress();
      
      const ContentRegistryV2 = await ethers.getContractFactory("ContentRegistryV2");
      const proxyV2 = await upgrades.upgradeProxy(proxyAddress, ContentRegistryV2);
      await proxyV2.waitForDeployment();
      
      // Test V1 functions still work
      const hash = ethers.keccak256(ethers.toUtf8Bytes("new-content"));
      const uri = "ipfs://QmNew/manifest.json";
      
      await expect(proxyV2.connect(user1).register(hash, uri))
        .to.emit(proxyV2, "ContentRegistered");
      
      const entry = await proxyV2.entries(hash);
      expect(entry.creator).to.equal(user1.address);
    });

    it("owner functions work after upgrade", async function () {
      const [owner, newOwner] = await ethers.getSigners();
      
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      const proxyV1 = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxyV1.waitForDeployment();
      const proxyAddress = await proxyV1.getAddress();
      
      const ContentRegistryV2 = await ethers.getContractFactory("ContentRegistryV2");
      const proxyV2 = await upgrades.upgradeProxy(proxyAddress, ContentRegistryV2);
      await proxyV2.waitForDeployment();
      
      // Test ownership transfer still works
      await proxyV2.connect(owner).transferOwnership(newOwner.address);
      expect(await proxyV2.owner()).to.equal(newOwner.address);
    });
  });

  describe("V2 New Features", function () {
    it("provides new V2 functionality", async function () {
      const [owner, user1] = await ethers.getSigners();
      
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      const proxyV1 = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxyV1.waitForDeployment();
      const proxyAddress = await proxyV1.getAddress();
      
      const ContentRegistryV2 = await ethers.getContractFactory("ContentRegistryV2");
      const proxyV2 = await upgrades.upgradeProxy(proxyAddress, ContentRegistryV2);
      await proxyV2.waitForDeployment();
      
      // Test new function
      const totalBefore = await proxyV2.getTotalRegistrations();
      expect(totalBefore).to.equal(0);
      
      const hash = ethers.keccak256(ethers.toUtf8Bytes("v2-content"));
      const uri = "ipfs://QmV2/manifest.json";
      await proxyV2.connect(user1).registerV2(hash, uri);
      
      const totalAfter = await proxyV2.getTotalRegistrations();
      expect(totalAfter).to.equal(1);
    });

    it("reports correct version after upgrade", async function () {
      const [owner] = await ethers.getSigners();
      
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      const proxyV1 = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxyV1.waitForDeployment();
      
      expect(await proxyV1.version()).to.equal("1.0.0");
      
      const proxyAddress = await proxyV1.getAddress();
      const ContentRegistryV2 = await ethers.getContractFactory("ContentRegistryV2");
      const proxyV2 = await upgrades.upgradeProxy(proxyAddress, ContentRegistryV2);
      await proxyV2.waitForDeployment();
      
      expect(await proxyV2.version()).to.equal("2.0.0");
    });
  });

  describe("Upgrade Authorization", function () {
    it("prevents non-owner from upgrading", async function () {
      const [owner, nonOwner] = await ethers.getSigners();
      
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      const proxyV1 = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxyV1.waitForDeployment();
      const proxyAddress = await proxyV1.getAddress();
      
      const ContentRegistryV2NonOwner = await ethers.getContractFactory("ContentRegistryV2", nonOwner);
      
      await expect(
        upgrades.upgradeProxy(proxyAddress, ContentRegistryV2NonOwner)
      ).to.be.revertedWithCustomError(proxyV1, "OwnableUnauthorizedAccount");
    });

    it("allows owner to upgrade", async function () {
      const [owner] = await ethers.getSigners();
      
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      const proxyV1 = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxyV1.waitForDeployment();
      const proxyAddress = await proxyV1.getAddress();
      
      const implV1 = await upgrades.erc1967.getImplementationAddress(proxyAddress);
      
      const ContentRegistryV2 = await ethers.getContractFactory("ContentRegistryV2");
      await upgrades.upgradeProxy(proxyAddress, ContentRegistryV2);
      
      const implV2 = await upgrades.erc1967.getImplementationAddress(proxyAddress);
      
      expect(implV2).to.not.equal(implV1);
      expect(implV2).to.be.properAddress;
    });

    it("changes implementation address on upgrade", async function () {
      const [owner] = await ethers.getSigners();
      
      const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
      const proxyV1 = await upgrades.deployProxy(ContentRegistryV1, [owner.address], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxyV1.waitForDeployment();
      const proxyAddress = await proxyV1.getAddress();
      
      const implV1 = await upgrades.erc1967.getImplementationAddress(proxyAddress);
      
      const ContentRegistryV2 = await ethers.getContractFactory("ContentRegistryV2");
      await upgrades.upgradeProxy(proxyAddress, ContentRegistryV2);
      
      const implV2 = await upgrades.erc1967.getImplementationAddress(proxyAddress);
      
      expect(implV2).to.not.equal(implV1);
      expect(implV2).to.be.properAddress;
    });
  });
});
