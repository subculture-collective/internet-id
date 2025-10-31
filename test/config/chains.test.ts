import { expect } from "chai";
import {
  SUPPORTED_CHAINS,
  getChainById,
  getChainByName,
  getMainnetChains,
  getTestnetChains,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "../../config/chains";

describe("Chain Configuration", function () {
  describe("SUPPORTED_CHAINS", function () {
    it("should contain all expected chains", function () {
      const chainNames = Object.keys(SUPPORTED_CHAINS);
      expect(chainNames).to.include.members([
        "ethereum",
        "sepolia",
        "polygon",
        "polygonAmoy",
        "base",
        "baseSepolia",
        "arbitrum",
        "arbitrumSepolia",
        "optimism",
        "optimismSepolia",
        "localhost",
      ]);
    });

    it("should have valid chain IDs", function () {
      for (const chain of Object.values(SUPPORTED_CHAINS)) {
        expect(chain.chainId).to.be.a("number");
        expect(chain.chainId).to.be.greaterThan(0);
      }
    });

    it("should have valid block explorers for non-localhost chains", function () {
      for (const chain of Object.values(SUPPORTED_CHAINS)) {
        if (chain.name !== "localhost") {
          expect(chain.blockExplorer).to.be.a("string");
          expect(chain.blockExplorer.length).to.be.greaterThan(0);
          expect(chain.blockExplorer).to.match(/^https?:\/\//);
        }
      }
    });

    it("should have valid RPC URLs", function () {
      for (const chain of Object.values(SUPPORTED_CHAINS)) {
        expect(chain.rpcUrl).to.be.a("string");
        expect(chain.rpcUrl.length).to.be.greaterThan(0);
        expect(chain.rpcUrl).to.match(/^https?:\/\//);
      }
    });

    it("should correctly mark testnets and mainnets", function () {
      expect(SUPPORTED_CHAINS.ethereum.testnet).to.be.false;
      expect(SUPPORTED_CHAINS.sepolia.testnet).to.be.true;
      expect(SUPPORTED_CHAINS.polygon.testnet).to.be.false;
      expect(SUPPORTED_CHAINS.polygonAmoy.testnet).to.be.true;
      expect(SUPPORTED_CHAINS.base.testnet).to.be.false;
      expect(SUPPORTED_CHAINS.baseSepolia.testnet).to.be.true;
      expect(SUPPORTED_CHAINS.arbitrum.testnet).to.be.false;
      expect(SUPPORTED_CHAINS.arbitrumSepolia.testnet).to.be.true;
      expect(SUPPORTED_CHAINS.optimism.testnet).to.be.false;
      expect(SUPPORTED_CHAINS.optimismSepolia.testnet).to.be.true;
    });
  });

  describe("getChainById", function () {
    it("should return correct chain for valid chain ID", function () {
      const chain = getChainById(1);
      expect(chain).to.exist;
      expect(chain?.name).to.equal("ethereum");
      expect(chain?.chainId).to.equal(1);
    });

    it("should return correct chain for Base Sepolia", function () {
      const chain = getChainById(84532);
      expect(chain).to.exist;
      expect(chain?.name).to.equal("baseSepolia");
      expect(chain?.chainId).to.equal(84532);
    });

    it("should return undefined for invalid chain ID", function () {
      const chain = getChainById(999999);
      expect(chain).to.be.undefined;
    });

    it("should work for all supported chain IDs", function () {
      const expectedChainIds = [
        1, 11155111, 137, 80002, 8453, 84532, 42161, 421614, 10, 11155420, 31337,
      ];
      for (const chainId of expectedChainIds) {
        const chain = getChainById(chainId);
        expect(chain).to.exist;
        expect(chain?.chainId).to.equal(chainId);
      }
    });
  });

  describe("getChainByName", function () {
    it("should return correct chain for valid name", function () {
      const chain = getChainByName("ethereum");
      expect(chain).to.exist;
      expect(chain?.name).to.equal("ethereum");
      expect(chain?.chainId).to.equal(1);
    });

    it("should return correct chain for Base Sepolia", function () {
      const chain = getChainByName("baseSepolia");
      expect(chain).to.exist;
      expect(chain?.name).to.equal("baseSepolia");
      expect(chain?.chainId).to.equal(84532);
    });

    it("should return undefined for invalid name", function () {
      const chain = getChainByName("invalid_chain");
      expect(chain).to.be.undefined;
    });
  });

  describe("getMainnetChains", function () {
    it("should return only mainnet chains", function () {
      const mainnets = getMainnetChains();
      expect(mainnets).to.be.an("array");
      expect(mainnets.length).to.be.greaterThan(0);
      for (const chain of mainnets) {
        expect(chain.testnet).to.be.false;
      }
    });

    it("should include expected mainnet chains", function () {
      const mainnets = getMainnetChains();
      const names = mainnets.map((c) => c.name);
      expect(names).to.include.members(["ethereum", "polygon", "base", "arbitrum", "optimism"]);
    });

    it("should not include testnet chains", function () {
      const mainnets = getMainnetChains();
      const names = mainnets.map((c) => c.name);
      expect(names).to.not.include.members([
        "sepolia",
        "polygonAmoy",
        "baseSepolia",
        "arbitrumSepolia",
        "optimismSepolia",
      ]);
    });
  });

  describe("getTestnetChains", function () {
    it("should return only testnet chains", function () {
      const testnets = getTestnetChains();
      expect(testnets).to.be.an("array");
      expect(testnets.length).to.be.greaterThan(0);
      for (const chain of testnets) {
        expect(chain.testnet).to.be.true;
      }
    });

    it("should include expected testnet chains", function () {
      const testnets = getTestnetChains();
      const names = testnets.map((c) => c.name);
      expect(names).to.include.members([
        "sepolia",
        "polygonAmoy",
        "baseSepolia",
        "arbitrumSepolia",
        "optimismSepolia",
      ]);
    });
  });

  describe("getExplorerTxUrl", function () {
    it("should return correct URL for Ethereum mainnet", function () {
      const url = getExplorerTxUrl(1, "0x1234567890abcdef");
      expect(url).to.equal("https://etherscan.io/tx/0x1234567890abcdef");
    });

    it("should return correct URL for Base Sepolia", function () {
      const url = getExplorerTxUrl(84532, "0xabcdef1234567890");
      expect(url).to.equal("https://sepolia.basescan.org/tx/0xabcdef1234567890");
    });

    it("should return correct URL for Polygon", function () {
      const url = getExplorerTxUrl(137, "0xdeadbeef");
      expect(url).to.equal("https://polygonscan.com/tx/0xdeadbeef");
    });

    it("should return correct URL for Arbitrum", function () {
      const url = getExplorerTxUrl(42161, "0xcafebabe");
      expect(url).to.equal("https://arbiscan.io/tx/0xcafebabe");
    });

    it("should return correct URL for Optimism", function () {
      const url = getExplorerTxUrl(10, "0x1337");
      expect(url).to.equal("https://optimistic.etherscan.io/tx/0x1337");
    });

    it("should return undefined for invalid chain ID", function () {
      const url = getExplorerTxUrl(999999, "0x1234");
      expect(url).to.be.undefined;
    });

    it("should return undefined for localhost", function () {
      const url = getExplorerTxUrl(31337, "0x1234");
      expect(url).to.be.undefined;
    });
  });

  describe("getExplorerAddressUrl", function () {
    it("should return correct URL for Ethereum mainnet", function () {
      const url = getExplorerAddressUrl(1, "0x1234567890123456789012345678901234567890");
      expect(url).to.equal(
        "https://etherscan.io/address/0x1234567890123456789012345678901234567890"
      );
    });

    it("should return correct URL for Base Sepolia", function () {
      const url = getExplorerAddressUrl(84532, "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
      expect(url).to.equal(
        "https://sepolia.basescan.org/address/0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      );
    });

    it("should return correct URL for Polygon", function () {
      const url = getExplorerAddressUrl(137, "0x1111111111111111111111111111111111111111");
      expect(url).to.equal(
        "https://polygonscan.com/address/0x1111111111111111111111111111111111111111"
      );
    });

    it("should return undefined for invalid chain ID", function () {
      const url = getExplorerAddressUrl(999999, "0x1234567890123456789012345678901234567890");
      expect(url).to.be.undefined;
    });

    it("should return undefined for localhost", function () {
      const url = getExplorerAddressUrl(31337, "0x1234567890123456789012345678901234567890");
      expect(url).to.be.undefined;
    });
  });
});
