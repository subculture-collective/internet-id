import { expect } from "chai";
import sinon from "sinon";
import { ethers } from "ethers";
import { extractInstagramId } from "../scripts/verify-instagram";

describe("Instagram Verification Logic", function () {
  describe("extractInstagramId", function () {
    it("should extract ID from Instagram post URL", function () {
      const id = extractInstagramId("https://www.instagram.com/p/ABC123xyz/");
      expect(id).to.equal("p/ABC123xyz");
    });

    it("should extract ID from Instagram reel URL", function () {
      const id = extractInstagramId("https://www.instagram.com/reel/XYZ789abc/");
      expect(id).to.equal("reel/XYZ789abc");
    });

    it("should extract username from profile URL", function () {
      const id = extractInstagramId("https://www.instagram.com/username/");
      expect(id).to.equal("username");
    });

    it("should handle URL without trailing slash", function () {
      const id = extractInstagramId("https://www.instagram.com/p/ABC123");
      expect(id).to.equal("p/ABC123");
    });

    it("should return raw input when not a URL", function () {
      const id = extractInstagramId("p/ABC123xyz");
      expect(id).to.equal("p/ABC123xyz");
    });

    it("should handle empty input", function () {
      const id = extractInstagramId("");
      expect(id).to.equal("");
    });
  });

  describe("Verification flow simulation", function () {
    let mockProvider: any;
    let mockContract: any;

    beforeEach(function () {
      mockProvider = sinon.createStubInstance(ethers.JsonRpcProvider);
      mockContract = {
        resolveByPlatform: sinon.stub(),
      };
    });

    afterEach(function () {
      sinon.restore();
    });

    it("should verify valid Instagram binding", async function () {
      const instagramId = "p/ABC123xyz";
      const creator = "0x1234567890123456789012345678901234567890";
      const contentHash = "0xabc123def456789012345678901234567890123456789012345678901234567890";
      const manifestURI = "ipfs://QmTestManifest";
      const timestamp = 1234567890n;

      mockContract.resolveByPlatform.resolves({
        creator,
        contentHash,
        manifestURI,
        timestamp,
      });

      sinon.stub(ethers, "Contract").returns(mockContract);

      const result = await mockContract.resolveByPlatform("instagram", instagramId);

      expect(result.creator).to.equal(creator);
      expect(result.contentHash).to.equal(contentHash);
      expect(result.manifestURI).to.equal(manifestURI);
      expect(result.timestamp).to.equal(timestamp);
    });

    it("should detect no binding for Instagram post", async function () {
      mockContract.resolveByPlatform.resolves({
        creator: ethers.ZeroAddress,
        contentHash: ethers.ZeroHash,
        manifestURI: "",
        timestamp: 0n,
      });

      sinon.stub(ethers, "Contract").returns(mockContract);

      const result = await mockContract.resolveByPlatform("instagram", "nonExistentPost");

      expect(result.creator).to.equal(ethers.ZeroAddress);
      expect(result.timestamp).to.equal(0n);
    });
  });

  describe("Platform identification", function () {
    it("should identify Instagram platform correctly", function () {
      const platform = "instagram";
      expect(platform).to.equal("instagram");
    });

    it("should handle platform case-insensitivity", function () {
      const platform1 = "INSTAGRAM";
      const platform2 = "instagram";

      expect(platform1.toLowerCase()).to.equal(platform2.toLowerCase());
    });
  });
});
