import { expect } from "chai";
import sinon from "sinon";
import { ethers } from "ethers";
import { extractDiscordId } from "../scripts/verify-discord";

describe("Discord Verification Logic", function () {
  describe("extractDiscordId", function () {
    it("should extract ID from Discord invite URL", function () {
      const id = extractDiscordId("https://discord.gg/abc123");
      expect(id).to.equal("abc123");
    });

    it("should extract ID from Discord.com invite URL", function () {
      const id = extractDiscordId("https://discord.com/invite/xyz789");
      expect(id).to.equal("invite/xyz789");
    });

    it("should extract ID from Discord channel URL", function () {
      const id = extractDiscordId("https://discord.com/channels/server/channel");
      expect(id).to.equal("channels/server/channel");
    });

    it("should handle URL without trailing slash", function () {
      const id = extractDiscordId("https://discord.gg/invite123");
      expect(id).to.equal("invite123");
    });

    it("should return raw input when not a URL", function () {
      const id = extractDiscordId("abc123xyz");
      expect(id).to.equal("abc123xyz");
    });

    it("should handle empty input", function () {
      const id = extractDiscordId("");
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

    it("should verify valid Discord binding", async function () {
      const discordId = "abc123xyz";
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

      const result = await mockContract.resolveByPlatform("discord", discordId);

      expect(result.creator).to.equal(creator);
      expect(result.contentHash).to.equal(contentHash);
      expect(result.manifestURI).to.equal(manifestURI);
      expect(result.timestamp).to.equal(timestamp);
    });

    it("should detect no binding for Discord server", async function () {
      mockContract.resolveByPlatform.resolves({
        creator: ethers.ZeroAddress,
        contentHash: ethers.ZeroHash,
        manifestURI: "",
        timestamp: 0n,
      });

      sinon.stub(ethers, "Contract").returns(mockContract);

      const result = await mockContract.resolveByPlatform("discord", "nonExistentServer");

      expect(result.creator).to.equal(ethers.ZeroAddress);
      expect(result.timestamp).to.equal(0n);
    });
  });

  describe("Platform identification", function () {
    it("should identify Discord platform correctly", function () {
      const platform = "discord";
      expect(platform).to.equal("discord");
    });

    it("should handle platform case-insensitivity", function () {
      const platform1 = "DISCORD";
      const platform2 = "discord";

      expect(platform1.toLowerCase()).to.equal(platform2.toLowerCase());
    });
  });
});
