import { expect } from "chai";
import { sha256Hex } from "../../scripts/services/hash.service";
import { parsePlatformInput } from "../../scripts/services/platform.service";

describe("Service Layer", function () {
  describe("hash.service", function () {
    it("computes SHA-256 hash with 0x prefix", function () {
      const buf = Buffer.from("hello world");
      const hash = sha256Hex(buf);
      expect(hash).to.match(/^0x[0-9a-f]{64}$/);
      // Known SHA-256 hash of "hello world"
      expect(hash).to.equal("0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
    });
  });

  describe("platform.service", function () {
    it("parses YouTube URL correctly", function () {
      const result = parsePlatformInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result).to.deep.equal({
        platform: "youtube",
        platformId: "dQw4w9WgXcQ",
      });
    });

    it("parses YouTube short URL correctly", function () {
      const result = parsePlatformInput("https://youtu.be/dQw4w9WgXcQ");
      expect(result).to.deep.equal({
        platform: "youtube",
        platformId: "dQw4w9WgXcQ",
      });
    });

    it("parses X/Twitter URL correctly", function () {
      const result = parsePlatformInput("https://x.com/user/status/1234567890");
      expect(result).to.deep.equal({
        platform: "x",
        platformId: "1234567890",
      });
    });

    it("parses TikTok URL correctly", function () {
      const result = parsePlatformInput("https://www.tiktok.com/@user/video/123");
      expect(result).to.deep.equal({
        platform: "tiktok",
        platformId: "@user/video/123",
      });
    });

    it("uses explicit platform and platformId when provided", function () {
      const result = parsePlatformInput(undefined, "custom", "id123");
      expect(result).to.deep.equal({
        platform: "custom",
        platformId: "id123",
      });
    });

    it("returns null when no input provided", function () {
      const result = parsePlatformInput();
      expect(result).to.be.null;
    });
  });
});
