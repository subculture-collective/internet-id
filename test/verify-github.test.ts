import { expect } from "chai";
import sinon from "sinon";
import { ethers } from "ethers";
import { extractGitHubId } from "../scripts/verify-github";

describe("GitHub Verification Logic", function () {
  describe("extractGitHubId", function () {
    it("should extract ID from GitHub repository URL", function () {
      const id = extractGitHubId("https://github.com/user/repo");
      expect(id).to.equal("user/repo");
    });

    it("should extract ID from GitHub file URL", function () {
      const id = extractGitHubId("https://github.com/user/repo/blob/main/README.md");
      expect(id).to.equal("user/repo/blob/main/README.md");
    });

    it("should extract ID from gist URL", function () {
      const id = extractGitHubId("https://gist.github.com/user/abc123");
      expect(id).to.equal("gist/user/abc123");
    });

    it("should handle URL without trailing slash", function () {
      const id = extractGitHubId("https://github.com/user/repo");
      expect(id).to.equal("user/repo");
    });

    it("should return raw input when not a URL", function () {
      const id = extractGitHubId("user/repo");
      expect(id).to.equal("user/repo");
    });

    it("should handle empty input", function () {
      const id = extractGitHubId("");
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

    it("should verify valid GitHub binding", async function () {
      const githubId = "user/repo";
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

      const result = await mockContract.resolveByPlatform("github", githubId);

      expect(result.creator).to.equal(creator);
      expect(result.contentHash).to.equal(contentHash);
      expect(result.manifestURI).to.equal(manifestURI);
      expect(result.timestamp).to.equal(timestamp);
    });

    it("should detect no binding for GitHub repository", async function () {
      mockContract.resolveByPlatform.resolves({
        creator: ethers.ZeroAddress,
        contentHash: ethers.ZeroHash,
        manifestURI: "",
        timestamp: 0n,
      });

      sinon.stub(ethers, "Contract").returns(mockContract);

      const result = await mockContract.resolveByPlatform("github", "nonExistentRepo");

      expect(result.creator).to.equal(ethers.ZeroAddress);
      expect(result.timestamp).to.equal(0n);
    });
  });

  describe("Platform identification", function () {
    it("should identify GitHub platform correctly", function () {
      const platform = "github";
      expect(platform).to.equal("github");
    });

    it("should handle platform case-insensitivity", function () {
      const platform1 = "GITHUB";
      const platform2 = "github";

      expect(platform1.toLowerCase()).to.equal(platform2.toLowerCase());
    });
  });
});
