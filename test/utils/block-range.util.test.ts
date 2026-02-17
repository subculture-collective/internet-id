import { expect } from "chai";
import { ethers } from "ethers";
import * as sinon from "sinon";
import { getStartBlock } from "../../scripts/utils/block-range.util";

describe("Block Range Utilities", () => {
  let originalEnv: string | undefined;
  let providerStub: sinon.SinonStubbedInstance<ethers.JsonRpcProvider>;

  beforeEach(() => {
    // Store original REGISTRY_START_BLOCK
    originalEnv = process.env.REGISTRY_START_BLOCK;

    // Create provider stub
    providerStub = sinon.createStubInstance(ethers.JsonRpcProvider);
  });

  afterEach(() => {
    // Restore REGISTRY_START_BLOCK
    if (originalEnv !== undefined) {
      process.env.REGISTRY_START_BLOCK = originalEnv;
    } else {
      delete process.env.REGISTRY_START_BLOCK;
    }

    // Restore stubs
    sinon.restore();
  });

  describe("getStartBlock", () => {
    it("should use REGISTRY_START_BLOCK when set to valid positive number", async () => {
      process.env.REGISTRY_START_BLOCK = "5000000";
      providerStub.getBlockNumber.resolves(10000000);

      const result = await getStartBlock(providerStub as any);

      expect(result).to.equal(5000000);
      expect(providerStub.getBlockNumber.called).to.be.false;
    });

    it("should use REGISTRY_START_BLOCK when set to zero", async () => {
      process.env.REGISTRY_START_BLOCK = "0";
      providerStub.getBlockNumber.resolves(10000000);

      const result = await getStartBlock(providerStub as any);

      expect(result).to.equal(0);
      expect(providerStub.getBlockNumber.called).to.be.false;
    });

    it("should fall back to default when REGISTRY_START_BLOCK is invalid (NaN)", async () => {
      process.env.REGISTRY_START_BLOCK = "not-a-number";
      providerStub.getBlockNumber.resolves(10000000);

      const result = await getStartBlock(providerStub as any);

      expect(result).to.equal(9000000); // 10000000 - 1000000
      expect(providerStub.getBlockNumber.calledOnce).to.be.true;
    });

    it("should fall back to default when REGISTRY_START_BLOCK is negative", async () => {
      process.env.REGISTRY_START_BLOCK = "-100";
      providerStub.getBlockNumber.resolves(10000000);

      const result = await getStartBlock(providerStub as any);

      expect(result).to.equal(9000000); // 10000000 - 1000000
      expect(providerStub.getBlockNumber.calledOnce).to.be.true;
    });

    it("should fall back to default when REGISTRY_START_BLOCK is not set", async () => {
      delete process.env.REGISTRY_START_BLOCK;
      providerStub.getBlockNumber.resolves(10000000);

      const result = await getStartBlock(providerStub as any);

      expect(result).to.equal(9000000); // 10000000 - 1000000
      expect(providerStub.getBlockNumber.calledOnce).to.be.true;
    });

    it("should return 0 when current block is less than 1 million", async () => {
      delete process.env.REGISTRY_START_BLOCK;
      providerStub.getBlockNumber.resolves(500000);

      const result = await getStartBlock(providerStub as any);

      expect(result).to.equal(0); // Math.max(0, 500000 - 1000000)
      expect(providerStub.getBlockNumber.calledOnce).to.be.true;
    });

    it("should return 0 when current block is exactly 1 million", async () => {
      delete process.env.REGISTRY_START_BLOCK;
      providerStub.getBlockNumber.resolves(1000000);

      const result = await getStartBlock(providerStub as any);

      expect(result).to.equal(0); // Math.max(0, 1000000 - 1000000)
      expect(providerStub.getBlockNumber.calledOnce).to.be.true;
    });

    it("should calculate correct starting block for high block numbers", async () => {
      delete process.env.REGISTRY_START_BLOCK;
      providerStub.getBlockNumber.resolves(20000000);

      const result = await getStartBlock(providerStub as any);

      expect(result).to.equal(19000000); // 20000000 - 1000000
      expect(providerStub.getBlockNumber.calledOnce).to.be.true;
    });

    it("should handle REGISTRY_START_BLOCK with leading zeros", async () => {
      process.env.REGISTRY_START_BLOCK = "0001000000";
      providerStub.getBlockNumber.resolves(10000000);

      const result = await getStartBlock(providerStub as any);

      expect(result).to.equal(1000000);
      expect(providerStub.getBlockNumber.called).to.be.false;
    });

    it("should handle REGISTRY_START_BLOCK with whitespace by treating it as invalid", async () => {
      process.env.REGISTRY_START_BLOCK = " 1000000 ";
      providerStub.getBlockNumber.resolves(10000000);

      const result = await getStartBlock(providerStub as any);

      // parseInt handles leading/trailing whitespace, so this should work
      expect(result).to.equal(1000000);
      expect(providerStub.getBlockNumber.called).to.be.false;
    });

    it("should handle REGISTRY_START_BLOCK as empty string", async () => {
      process.env.REGISTRY_START_BLOCK = "";
      providerStub.getBlockNumber.resolves(10000000);

      const result = await getStartBlock(providerStub as any);

      // Empty string will be falsy in the if check, so it should use default
      expect(result).to.equal(9000000);
      expect(providerStub.getBlockNumber.calledOnce).to.be.true;
    });

    it("should handle REGISTRY_START_BLOCK with decimal (uses floor)", async () => {
      process.env.REGISTRY_START_BLOCK = "1234567.89";
      providerStub.getBlockNumber.resolves(10000000);

      const result = await getStartBlock(providerStub as any);

      expect(result).to.equal(1234567); // parseInt floors the value
      expect(providerStub.getBlockNumber.called).to.be.false;
    });

    it("should handle very large REGISTRY_START_BLOCK values", async () => {
      process.env.REGISTRY_START_BLOCK = "999999999999";
      providerStub.getBlockNumber.resolves(10000000);

      const result = await getStartBlock(providerStub as any);

      expect(result).to.equal(999999999999);
      expect(providerStub.getBlockNumber.called).to.be.false;
    });

    it("should handle provider errors gracefully", async () => {
      delete process.env.REGISTRY_START_BLOCK;
      providerStub.getBlockNumber.rejects(new Error("Network error"));

      try {
        await getStartBlock(providerStub as any);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.equal("Network error");
      }
    });
  });
});
