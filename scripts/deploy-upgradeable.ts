import { ethers, upgrades, network } from "hardhat";
import { mkdirSync, writeFileSync } from "fs";
import * as path from "path";

/**
 * Deploy ContentRegistryV1 using UUPS upgradeable proxy pattern
 * This script deploys the proxy and implementation contracts
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying upgradeable ContentRegistry with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");

  console.log("Deploying ContentRegistryV1 proxy...");
  const proxy = await upgrades.deployProxy(ContentRegistryV1, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
  });

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("ContentRegistryV1 Proxy deployed to:", proxyAddress);
  console.log("ContentRegistryV1 Implementation deployed to:", implementationAddress);
  console.log("Owner:", deployer.address);

  // Save deployment information
  try {
    const dir = path.join(process.cwd(), "deployed");
    mkdirSync(dir, { recursive: true });
    const out = path.join(dir, `${network.name}-upgradeable.json`);

    const deploymentInfo = {
      proxy: proxyAddress,
      implementation: implementationAddress,
      owner: deployer.address,
      version: "1.0.0",
      deployedAt: new Date().toISOString(),
      network: network.name,
    };

    writeFileSync(out, JSON.stringify(deploymentInfo, null, 2));
    console.log("Saved deployment info to:", out);
  } catch (e) {
    console.warn("Warning: failed to write deployment info file:", e);
  }

  // Validate deployment
  console.log("\nValidating deployment...");
  const version = await proxy.version();
  console.log("Contract version:", version);

  const owner = await proxy.owner();
  console.log("Contract owner:", owner);

  console.log("\nDeployment successful!");
  console.log("\nIMPORTANT: Save these addresses for future upgrades:");
  console.log("- Proxy Address:", proxyAddress);
  console.log("- Implementation Address:", implementationAddress);
  console.log("- Owner Address:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
