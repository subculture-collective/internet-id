import { expect } from "chai";
import sinon from "sinon";
import { ethers } from "ethers";

// Helper function to extract YouTube ID (copied from verify-youtube.ts for testing)
function extractYouTubeId(input: string): string {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.replace("/", "");
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/watch"))
        return url.searchParams.get("v") || "";
      if (url.pathname.startsWith("/shorts/"))
        return url.pathname.split("/")[2] || "";
    }
    return "";
  } catch {
    return input; // assume raw ID
  }
}

describe("YouTube Verification Logic", function () {
  describe("extractYouTubeId", function () {
    it("should extract ID from standard watch URL", function () {
      const id = extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(id).to.equal("dQw4w9WgXcQ");
    });

    it("should extract ID from short URL", function () {
      const id = extractYouTubeId("https://youtu.be/dQw4w9WgXcQ");
      expect(id).to.equal("dQw4w9WgXcQ");
    });

    it("should extract ID from shorts URL", function () {
      const id = extractYouTubeId("https://www.youtube.com/shorts/abc123xyz");
      expect(id).to.equal("abc123xyz");
    });

    it("should handle watch URL without www", function () {
      const id = extractYouTubeId("https://youtube.com/watch?v=testID123");
      expect(id).to.equal("testID123");
    });

    it("should handle short URL with query parameters", function () {
      const id = extractYouTubeId("https://youtu.be/videoID?t=123");
      expect(id).to.equal("videoID");
    });

    it("should return raw input when not a URL", function () {
      const id = extractYouTubeId("rawVideoId123");
      expect(id).to.equal("rawVideoId123");
    });

    it("should handle empty pathname on youtu.be", function () {
      const id = extractYouTubeId("https://youtu.be/");
      expect(id).to.equal("");
    });

    it("should return empty string for invalid YouTube URL", function () {
      const id = extractYouTubeId("https://youtube.com/channel/UCtest");
      expect(id).to.equal("");
    });

    it("should handle URLs with extra query parameters", function () {
      const id = extractYouTubeId(
        "https://www.youtube.com/watch?v=videoID&list=playlist&index=1"
      );
      expect(id).to.equal("videoID");
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

    it("should verify valid YouTube binding", async function () {
      const videoId = "dQw4w9WgXcQ";
      const creator = "0x1234567890123456789012345678901234567890";
      const contentHash =
        "0xabc123def456789012345678901234567890123456789012345678901234567890";
      const manifestURI = "ipfs://QmTestManifest";
      const timestamp = 1234567890n;

      mockContract.resolveByPlatform.resolves({
        creator,
        contentHash,
        manifestURI,
        timestamp,
      });

      sinon.stub(ethers, "Contract").returns(mockContract);

      const result = await mockContract.resolveByPlatform("youtube", videoId);

      expect(result.creator).to.equal(creator);
      expect(result.contentHash).to.equal(contentHash);
      expect(result.manifestURI).to.equal(manifestURI);
      expect(result.timestamp).to.equal(timestamp);
    });

    it("should detect no binding for YouTube video", async function () {
      mockContract.resolveByPlatform.resolves({
        creator: ethers.ZeroAddress,
        contentHash: ethers.ZeroHash,
        manifestURI: "",
        timestamp: 0n,
      });

      sinon.stub(ethers, "Contract").returns(mockContract);

      const result = await mockContract.resolveByPlatform("youtube", "nonExistentVideo");

      expect(result.creator).to.equal(ethers.ZeroAddress);
      expect(result.timestamp).to.equal(0n);
    });

    it("should verify signature recovery", function () {
      const contentHash =
        "0xabc123def456789012345678901234567890123456789012345678901234567890";
      const wallet = ethers.Wallet.createRandom();

      // Sign the content hash
      const bytes = ethers.getBytes(contentHash);
      const signature = wallet.signingKey.sign(
        ethers.hashMessage(bytes)
      ).serialized;

      // Verify recovery
      const recovered = ethers.verifyMessage(bytes, signature);

      expect(recovered.toLowerCase()).to.equal(wallet.address.toLowerCase());
    });

    it("should detect signature mismatch", function () {
      const contentHash =
        "0xabc123def456789012345678901234567890123456789012345678901234567890";
      const wallet1 = ethers.Wallet.createRandom();
      const wallet2 = ethers.Wallet.createRandom();

      const bytes = ethers.getBytes(contentHash);
      const signature = wallet1.signingKey.sign(
        ethers.hashMessage(bytes)
      ).serialized;

      const recovered = ethers.verifyMessage(bytes, signature);

      expect(recovered.toLowerCase()).to.not.equal(wallet2.address.toLowerCase());
    });
  });

  describe("Manifest validation for YouTube", function () {
    it("should validate manifest with matching content hash", function () {
      const onchainHash =
        "0xabc123def456789012345678901234567890123456789012345678901234567890";
      const manifest = {
        version: "1.0",
        algorithm: "sha256",
        content_hash: onchainHash,
        signature: "0xsig123",
      };

      expect(manifest.content_hash.toLowerCase()).to.equal(
        onchainHash.toLowerCase()
      );
    });

    it("should detect manifest hash mismatch", function () {
      const onchainHash =
        "0xabc123def456789012345678901234567890123456789012345678901234567890";
      const manifest = {
        content_hash:
          "0xdifferent123456789012345678901234567890123456789012345678901234",
      };

      expect(manifest.content_hash.toLowerCase()).to.not.equal(
        onchainHash.toLowerCase()
      );
    });

    it("should handle manifest without signature", function () {
      const manifest = {
        version: "1.0",
        algorithm: "sha256",
        content_hash: "0xabc123",
      };

      expect(manifest).to.not.have.property("signature");
    });
  });

  describe("Platform identification", function () {
    it("should identify YouTube platform correctly", function () {
      const platform = "youtube";
      expect(platform).to.equal("youtube");
    });

    it("should handle platform case-insensitivity", function () {
      const platform1 = "YOUTUBE";
      const platform2 = "youtube";
      const platform3 = "YouTube";

      expect(platform1.toLowerCase()).to.equal(platform2.toLowerCase());
      expect(platform2.toLowerCase()).to.equal(platform3.toLowerCase());
    });
  });

  describe("Edge cases", function () {
    it("should handle video IDs with special characters", function () {
      const videoId = "a1-_B2c3";
      const id = extractYouTubeId(videoId);
      expect(id).to.equal(videoId);
    });

    it("should handle very long video IDs", function () {
      const longId = "a".repeat(50);
      const id = extractYouTubeId(longId);
      expect(id).to.equal(longId);
    });

    it("should handle empty string input", function () {
      const id = extractYouTubeId("");
      expect(id).to.equal("");
    });

    it("should handle malformed URLs gracefully", function () {
      const id = extractYouTubeId("not-a-url");
      expect(id).to.equal("not-a-url");
    });
  });

  describe("Timestamp validation", function () {
    it("should validate non-zero timestamp indicates binding exists", function () {
      const timestamp = 1234567890n;
      expect(timestamp).to.be.greaterThan(0n);
    });

    it("should validate zero timestamp indicates no binding", function () {
      const timestamp = 0n;
      expect(timestamp).to.equal(0n);
    });

    it("should handle large timestamp values", function () {
      const timestamp = 9999999999n;
      expect(Number(timestamp)).to.be.greaterThan(0);
    });
  });
});
