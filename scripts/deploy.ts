import { ethers } from "hardhat";

async function main() {
  const Factory = await ethers.getContractFactory("ContentRegistry");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  console.log("ContentRegistry deployed to:", await contract.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
