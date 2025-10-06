import { expect } from "chai";
import { ethers } from "hardhat";

describe("ContentRegistry", function () {
  it("registers and reads entry", async function () {
    const [creator] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContentRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("hello"));
    const uri = "ipfs://cid/manifest.json";

    await expect(registry.connect(creator).register(hash, uri)).to.emit(
      registry,
      "ContentRegistered"
    );

    const entry = await registry.entries(hash);
    expect(entry.creator).to.eq(creator.address);
    expect(entry.manifestURI).to.eq(uri);
  });
});
