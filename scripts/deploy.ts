import { ethers, network } from "hardhat";
import { mkdirSync, writeFileSync } from "fs";
import * as path from "path";

async function main() {
  const Factory = await ethers.getContractFactory("ContentRegistry");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("ContentRegistry deployed to:", addr);
  try {
    const dir = path.join(process.cwd(), "deployed");
    mkdirSync(dir, { recursive: true });
    const out = path.join(dir, `${network.name}.json`);
    writeFileSync(out, JSON.stringify({ address: addr }, null, 2));
    console.log("Saved address to:", out);
  } catch (e) {
    console.warn("Warning: failed to write deployed address file:", e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
