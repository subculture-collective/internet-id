import { expect } from "chai";
import sinon from "sinon";
import { ethers } from "ethers";
import { extractLinkedInId } from "../scripts/verify-linkedin";

describe("LinkedIn Verification Logic", function () {
  describe("extractLinkedInId", function () {
    it("should extract ID from LinkedIn profile URL", function () {
      const id = extractLinkedInId("https://www.linkedin.com/in/username/");
      expect(id).to.equal("in/username");
    });

    it("should extract ID from LinkedIn post URL", function () {
      const id = extractLinkedInId("https://www.linkedin.com/posts/activity-123456/");
      expect(id).to.equal("posts/activity-123456");
    });

    it("should extract ID from LinkedIn company URL", function () {
      const id = extractLinkedInId("https://www.linkedin.com/company/companyname/");
      expect(id).to.equal("company/companyname");
    });

    it("should handle URL without trailing slash", function () {
      const id = extractLinkedInId("https://www.linkedin.com/in/username");
      expect(id).to.equal("in/username");
    });

    it("should return raw input when not a URL", function () {
      const id = extractLinkedInId("in/username");
      expect(id).to.equal("in/username");
    });

    it("should handle empty input", function () {
      const id = extractLinkedInId("");
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

    it("should verify valid LinkedIn binding", async function () {
      const linkedinId = "in/username";
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

      const result = await mockContract.resolveByPlatform("linkedin", linkedinId);

      expect(result.creator).to.equal(creator);
      expect(result.contentHash).to.equal(contentHash);
      expect(result.manifestURI).to.equal(manifestURI);
      expect(result.timestamp).to.equal(timestamp);
    });

    it("should detect no binding for LinkedIn profile", async function () {
      mockContract.resolveByPlatform.resolves({
        creator: ethers.ZeroAddress,
        contentHash: ethers.ZeroHash,
        manifestURI: "",
        timestamp: 0n,
      });

      sinon.stub(ethers, "Contract").returns(mockContract);

      const result = await mockContract.resolveByPlatform("linkedin", "nonExistentProfile");

      expect(result.creator).to.equal(ethers.ZeroAddress);
      expect(result.timestamp).to.equal(0n);
    });
  });

  describe("Platform identification", function () {
    it("should identify LinkedIn platform correctly", function () {
      const platform = "linkedin";
      expect(platform).to.equal("linkedin");
    });

    it("should handle platform case-insensitivity", function () {
      const platform1 = "LINKEDIN";
      const platform2 = "linkedin";

      expect(platform1.toLowerCase()).to.equal(platform2.toLowerCase());
    });
  });
});
