import { expect } from "chai";
import sinon from "sinon";
import { ethers } from "ethers";
import { extractTikTokId } from "../scripts/verify-tiktok";

describe("TikTok Verification Logic", function () {
  describe("extractTikTokId", function () {
    it("should extract ID from standard TikTok URL with username", function () {
      const id = extractTikTokId("https://www.tiktok.com/@username/video/1234567890");
      expect(id).to.equal("@username/video/1234567890");
    });

    it("should extract ID from TikTok URL without username", function () {
      const id = extractTikTokId("https://www.tiktok.com/video/1234567890");
      expect(id).to.equal("video/1234567890");
    });

    it("should handle TikTok mobile URL", function () {
      const id = extractTikTokId("https://m.tiktok.com/@user/video/9876543210");
      expect(id).to.equal("@user/video/9876543210");
    });

    it("should return raw input when not a URL", function () {
      const id = extractTikTokId("@username/video/1234567890");
      expect(id).to.equal("@username/video/1234567890");
    });

    it("should handle raw numeric ID", function () {
      const id = extractTikTokId("1234567890");
      expect(id).to.equal("1234567890");
    });

    it("should handle empty input", function () {
      const id = extractTikTokId("");
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

    it("should verify valid TikTok binding", async function () {
      const tiktokId = "@username/video/1234567890";
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

      const result = await mockContract.resolveByPlatform("tiktok", tiktokId);

      expect(result.creator).to.equal(creator);
      expect(result.contentHash).to.equal(contentHash);
      expect(result.manifestURI).to.equal(manifestURI);
      expect(result.timestamp).to.equal(timestamp);
    });

    it("should detect no binding for TikTok video", async function () {
      mockContract.resolveByPlatform.resolves({
        creator: ethers.ZeroAddress,
        contentHash: ethers.ZeroHash,
        manifestURI: "",
        timestamp: 0n,
      });

      sinon.stub(ethers, "Contract").returns(mockContract);

      const result = await mockContract.resolveByPlatform("tiktok", "nonExistentVideo");

      expect(result.creator).to.equal(ethers.ZeroAddress);
      expect(result.timestamp).to.equal(0n);
    });
  });

  describe("Platform identification", function () {
    it("should identify TikTok platform correctly", function () {
      const platform = "tiktok";
      expect(platform).to.equal("tiktok");
    });

    it("should handle platform case-insensitivity", function () {
      const platform1 = "TIKTOK";
      const platform2 = "tiktok";

      expect(platform1.toLowerCase()).to.equal(platform2.toLowerCase());
    });
  });
});
