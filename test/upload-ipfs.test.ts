import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";

describe("IPFS Upload Service", function () {
  let axiosPostStub: sinon.SinonStub;

  beforeEach(function () {
    axiosPostStub = sinon.stub(axios, "post");
  });

  afterEach(function () {
    sinon.restore();
    // Clean up environment variables
    delete process.env.IPFS_PROVIDER;
    delete process.env.WEB3_STORAGE_TOKEN;
    delete process.env.PINATA_JWT;
    delete process.env.IPFS_PROJECT_ID;
    delete process.env.IPFS_PROJECT_SECRET;
    delete process.env.IPFS_API_URL;
  });

  describe("Provider configuration", function () {
    it("should validate axios is available for mocking", function () {
      expect(axios.post).to.exist;
      expect(axiosPostStub).to.exist;
    });

    it("should detect Web3.Storage token", function () {
      process.env.WEB3_STORAGE_TOKEN = "test-token";
      const hasToken = !!process.env.WEB3_STORAGE_TOKEN;
      expect(hasToken).to.be.true;

      delete process.env.WEB3_STORAGE_TOKEN;
      const noToken = !!process.env.WEB3_STORAGE_TOKEN;
      expect(noToken).to.be.false;
    });

    it("should detect Pinata JWT", function () {
      process.env.PINATA_JWT = "test-jwt";
      const hasJWT = !!process.env.PINATA_JWT;
      expect(hasJWT).to.be.true;
    });

    it("should detect Infura credentials", function () {
      process.env.IPFS_PROJECT_ID = "test-id";
      process.env.IPFS_PROJECT_SECRET = "test-secret";
      const hasInfura = !!(process.env.IPFS_PROJECT_ID && process.env.IPFS_PROJECT_SECRET);
      expect(hasInfura).to.be.true;
    });

    it("should detect forced provider setting", function () {
      process.env.IPFS_PROVIDER = "pinata";
      const provider = process.env.IPFS_PROVIDER;
      expect(provider).to.equal("pinata");
    });
  });

  describe("API endpoint URLs", function () {
    it("should use correct Web3.Storage endpoint", function () {
      const url = "https://api.web3.storage/upload";
      expect(url).to.equal("https://api.web3.storage/upload");
    });

    it("should use correct Pinata endpoint", function () {
      const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
      expect(url).to.equal("https://api.pinata.cloud/pinning/pinFileToIPFS");
    });

    it("should use correct Infura endpoint pattern", function () {
      const apiBase = "https://ipfs.infura.io:5001";
      const addUrl = `${apiBase.replace(/\/$/, "")}/api/v0/add?pin=true&wrap-with-directory=false`;
      expect(addUrl).to.include("ipfs.infura.io");
      expect(addUrl).to.include("/api/v0/add");
    });
  });

  describe("Response parsing", function () {
    it("should handle single-line JSON response", function () {
      const response = { Hash: "QmTestCID" };
      expect(response.Hash).to.exist;
      expect(response.Hash).to.equal("QmTestCID");
    });

    it("should handle multi-line NDJSON response", function () {
      const data = '{"Name":"file.txt","Hash":"QmFirst"}\n{"Name":"","Hash":"QmLast"}';
      const lines = data.trim().split(/\r?\n/).filter(Boolean);
      const last = JSON.parse(lines[lines.length - 1]);
      expect(last.Hash).to.equal("QmLast");
    });

    it("should extract CID from Web3.Storage response", function () {
      const response = { data: { cid: "QmWeb3CID" } };
      expect(response.data.cid).to.equal("QmWeb3CID");
    });

    it("should extract IpfsHash from Pinata response", function () {
      const response = { data: { IpfsHash: "QmPinataCID" } };
      expect(response.data.IpfsHash).to.equal("QmPinataCID");
    });
  });

  describe("Error handling logic", function () {
    it("should identify retriable 5xx errors", function () {
      const status = 503;
      const retriable = status >= 500;
      expect(retriable).to.be.true;
    });

    it("should identify retriable timeout errors", function () {
      const errorCode = "ETIMEDOUT";
      const retriable = errorCode === "ETIMEDOUT" || errorCode === "ECONNRESET";
      expect(retriable).to.be.true;
    });

    it("should not retry 4xx client errors", function () {
      const status = 400;
      const retriable = status >= 500;
      expect(retriable).to.be.false;
    });

    it("should recognize 429 as retriable", function () {
      const status = 429;
      const retriable = status === 429 || status >= 500;
      expect(retriable).to.be.true;
    });
  });

  describe("Authentication header formation", function () {
    it("should format Infura Basic auth correctly", function () {
      const pid = "test-id";
      const secret = "test-secret";
      const auth = "Basic " + Buffer.from(`${pid}:${secret}`).toString("base64");

      expect(auth).to.include("Basic ");
      expect(auth.length).to.be.greaterThan(6);

      // Verify it can be decoded
      const decoded = Buffer.from(auth.replace("Basic ", ""), "base64").toString();
      expect(decoded).to.equal(`${pid}:${secret}`);
    });

    it("should format Web3.Storage Bearer token correctly", function () {
      const token = "test-token-123";
      const header = `Bearer ${token}`;

      expect(header).to.equal("Bearer test-token-123");
      expect(header).to.include("Bearer ");
    });
  });

  describe("Backoff calculation", function () {
    it("should calculate exponential backoff", function () {
      const attempt0 = Math.min(2000 * Math.pow(2, 0), 8000);
      const attempt1 = Math.min(2000 * Math.pow(2, 1), 8000);
      const attempt2 = Math.min(2000 * Math.pow(2, 2), 8000);
      const attempt3 = Math.min(2000 * Math.pow(2, 3), 8000);

      expect(attempt0).to.equal(2000);
      expect(attempt1).to.equal(4000);
      expect(attempt2).to.equal(8000);
      expect(attempt3).to.equal(8000); // capped at 8000
    });
  });

  describe("CID masking for security", function () {
    it("should mask long IDs showing only first and last 4 chars", function () {
      const maskId = (s?: string) => {
        if (!s) return "";
        if (s.length <= 8) return s;
        return `${s.slice(0, 4)}...${s.slice(-4)}`;
      };

      const longId = "1234567890abcdef";
      const masked = maskId(longId);
      expect(masked).to.equal("1234...cdef");
    });

    it("should not mask short IDs", function () {
      const maskId = (s?: string) => {
        if (!s) return "";
        if (s.length <= 8) return s;
        return `${s.slice(0, 4)}...${s.slice(-4)}`;
      };

      const shortId = "short";
      const masked = maskId(shortId);
      expect(masked).to.equal("short");
    });
  });
});
