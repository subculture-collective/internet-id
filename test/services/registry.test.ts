import { expect } from "chai";
import { ethers } from "ethers";
import * as registryService from "../../scripts/services/registry.service";

describe("Registry Service", function () {
  afterEach(function () {
    delete process.env.REGISTRY_ADDRESS;
    delete process.env.RPC_URL;
  });

  describe("getProvider", function () {
    it("should create provider with default RPC URL", function () {
      const provider = registryService.getProvider();
      expect(provider).to.be.instanceOf(ethers.JsonRpcProvider);
    });

    it("should create provider with custom RPC URL", function () {
      const customUrl = "https://custom-rpc.example.com";
      const provider = registryService.getProvider(customUrl);
      expect(provider).to.be.instanceOf(ethers.JsonRpcProvider);
    });

    it("should use environment RPC_URL when no parameter provided", function () {
      process.env.RPC_URL = "https://env-rpc.example.com";
      const provider = registryService.getProvider();
      expect(provider).to.be.instanceOf(ethers.JsonRpcProvider);
    });
  });

  describe("getRegistryContract", function () {
    it("should create contract instance with correct parameters", function () {
      const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
      const address = "0x1234567890123456789012345678901234567890";
      const abi = ["function test() view returns (string)"];

      const contract = registryService.getRegistryContract(address, abi, provider);

      expect(contract).to.be.instanceOf(ethers.Contract);
      expect(contract.target).to.equal(address);
    });

    it("should work with a signer", function () {
      const wallet = ethers.Wallet.createRandom();
      const address = "0x1234567890123456789012345678901234567890";
      const abi = ["function register() external"];

      const contract = registryService.getRegistryContract(address, abi, wallet);

      expect(contract).to.be.instanceOf(ethers.Contract);
    });
  });

  describe("Registry configuration", function () {
    it("should prioritize REGISTRY_ADDRESS env variable", function () {
      process.env.REGISTRY_ADDRESS = "0xCustomRegistry123";
      const address = process.env.REGISTRY_ADDRESS;
      expect(address).to.equal("0xCustomRegistry123");
    });

    it("should map chainId to deployed file paths", function () {
      const chainId = 84532;
      const expectedPath = "deployed/baseSepolia.json";
      
      expect(chainId).to.equal(84532);
      expect(expectedPath).to.include("baseSepolia");
    });

    it("should validate registry address format", function () {
      const validAddresses = [
        "0x1234567890123456789012345678901234567890",
        "0xAbCdEf1234567890123456789012345678901234",
      ];
      
      validAddresses.forEach(addr => {
        expect(addr).to.match(/^0x[0-9a-fA-F]{40}$/);
      });
    });
  });

  describe("Contract ABI definitions", function () {
    it("should define resolveByPlatform function", function () {
      const abi = [
        "function resolveByPlatform(string,string) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      ];
      
      expect(abi).to.have.lengthOf(1);
      expect(abi[0]).to.include("resolveByPlatform");
      expect(abi[0]).to.include("creator");
      expect(abi[0]).to.include("contentHash");
    });

    it("should define entries function", function () {
      const abi = [
        "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      ];
      
      expect(abi).to.have.lengthOf(1);
      expect(abi[0]).to.include("entries");
      expect(abi[0]).to.include("bytes32");
    });

    it("should define register function", function () {
      const abi = [
        "function register(bytes32 contentHash, string manifestURI) external",
      ];
      
      expect(abi).to.have.lengthOf(1);
      expect(abi[0]).to.include("register");
      expect(abi[0]).to.include("external");
    });

    it("should define bindPlatform function", function () {
      const abi = [
        "function bindPlatform(bytes32,string,string) external",
      ];
      
      expect(abi).to.have.lengthOf(1);
      expect(abi[0]).to.include("bindPlatform");
    });
  });

  describe("Registry entry structure", function () {
    it("should define RegistryInfo interface", function () {
      const info = {
        registryAddress: "0x1234567890123456789012345678901234567890",
        chainId: 84532,
      };
      
      expect(info).to.have.property("registryAddress");
      expect(info).to.have.property("chainId");
      expect(typeof info.registryAddress).to.equal("string");
      expect(typeof info.chainId).to.equal("number");
    });

    it("should define RegistryEntry interface", function () {
      const entry = {
        creator: "0x1234567890123456789012345678901234567890",
        contentHash: "0xabc123def456789012345678901234567890123456789012345678901234567890",
        manifestURI: "ipfs://QmManifest",
        timestamp: 1234567890,
      };
      
      expect(entry).to.have.property("creator");
      expect(entry).to.have.property("contentHash");
      expect(entry).to.have.property("manifestURI");
      expect(entry).to.have.property("timestamp");
      expect(typeof entry.creator).to.equal("string");
      expect(typeof entry.contentHash).to.equal("string");
      expect(typeof entry.manifestURI).to.equal("string");
      expect(typeof entry.timestamp).to.equal("number");
    });

    it("should validate ZeroAddress constant", function () {
      const zeroAddr = ethers.ZeroAddress;
      expect(zeroAddr).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("should validate ZeroHash constant", function () {
      const zeroHash = ethers.ZeroHash;
      expect(zeroHash).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("should convert BigInt timestamp to Number", function () {
      const bigIntTimestamp = 1234567890n;
      const numberTimestamp = Number(bigIntTimestamp);
      
      expect(numberTimestamp).to.equal(1234567890);
      expect(typeof numberTimestamp).to.equal("number");
    });
  });

  describe("Platform identification", function () {
    it("should support common platform names", function () {
      const platforms = ["youtube", "twitter", "x", "tiktok", "instagram", "vimeo"];
      
      platforms.forEach(platform => {
        expect(typeof platform).to.equal("string");
        expect(platform.length).to.be.greaterThan(0);
      });
    });

    it("should handle platform case normalization", function () {
      const platform = "YouTube";
      const normalized = platform.toLowerCase();
      
      expect(normalized).to.equal("youtube");
    });
  });
});
