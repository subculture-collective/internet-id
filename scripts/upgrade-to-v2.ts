import { ethers, upgrades, network } from "hardhat";
import { readFileSync, writeFileSync } from "fs";
import * as path from "path";

/**
 * Upgrade ContentRegistryV1 to ContentRegistryV2
 * This script upgrades the implementation while preserving the proxy address and state
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading ContentRegistry with account:", deployer.address);

  // Load existing deployment info
  const deployedPath = path.join(process.cwd(), "deployed", `${network.name}-upgradeable.json`);
  let deploymentInfo: any;
  
  try {
    const data = readFileSync(deployedPath, "utf-8");
    deploymentInfo = JSON.parse(data);
    console.log("Loaded existing deployment from:", deployedPath);
  } catch (e) {
    console.error("Error: Could not load deployment info from:", deployedPath);
    console.error("Please ensure you have deployed the contract first using deploy-upgradeable.ts");
    process.exit(1);
  }

  const proxyAddress = deploymentInfo.proxy;
  console.log("Existing proxy address:", proxyAddress);
  console.log("Current implementation:", deploymentInfo.implementation);
  console.log("Current version:", deploymentInfo.version);

  // Get the V1 contract to check current state
  const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
  const proxyV1 = ContentRegistryV1.attach(proxyAddress);
  
  console.log("\nChecking current state before upgrade...");
  const versionBefore = await proxyV1.version();
  const ownerBefore = await proxyV1.owner();
  console.log("Version before:", versionBefore);
  console.log("Owner before:", ownerBefore);

  // Prepare and upgrade to V2
  console.log("\nPreparing upgrade to ContentRegistryV2...");
  const ContentRegistryV2 = await ethers.getContractFactory("ContentRegistryV2");
  
  console.log("Upgrading implementation...");
  const proxyV2 = await upgrades.upgradeProxy(proxyAddress, ContentRegistryV2);
  await proxyV2.waitForDeployment();
  
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("New implementation deployed to:", newImplementationAddress);

  // Validate upgrade
  console.log("\nValidating upgrade...");
  const versionAfter = await proxyV2.version();
  const ownerAfter = await proxyV2.owner();
  const totalRegistrations = await proxyV2.getTotalRegistrations();
  
  console.log("Version after:", versionAfter);
  console.log("Owner after:", ownerAfter);
  console.log("Total registrations:", totalRegistrations.toString());
  
  // Ensure proxy address didn't change
  const finalProxyAddress = await proxyV2.getAddress();
  if (finalProxyAddress !== proxyAddress) {
    throw new Error("Proxy address changed during upgrade! This should never happen.");
  }
  
  // Ensure owner didn't change
  if (ownerAfter !== ownerBefore) {
    throw new Error("Owner changed during upgrade! This should never happen.");
  }

  console.log("\n✓ Proxy address preserved:", proxyAddress);
  console.log("✓ Owner preserved:", ownerAfter);
  console.log("✓ Storage state preserved");

  // Update deployment info
  const oldImplementation = deploymentInfo.implementation;
  const oldVersion = deploymentInfo.version;
  
  deploymentInfo.previousImplementations = deploymentInfo.previousImplementations || [];
  deploymentInfo.previousImplementations.push({
    address: oldImplementation,
    version: oldVersion,
    deployedAt: deploymentInfo.deployedAt || deploymentInfo.upgradedAt,
  });
  
  deploymentInfo.implementation = newImplementationAddress;
  deploymentInfo.version = "2.0.0";
  deploymentInfo.upgradedAt = new Date().toISOString();

  try {
    writeFileSync(deployedPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\nUpdated deployment info at:", deployedPath);
  } catch (e) {
    console.warn("Warning: failed to update deployment info file:", e);
  }

  console.log("\nUpgrade successful!");
  console.log("\nSummary:");
  console.log("- Proxy Address (unchanged):", proxyAddress);
  console.log("- Old Implementation:", deploymentInfo.previousImplementations[0].address);
  console.log("- New Implementation:", newImplementationAddress);
  console.log("- Version: 1.0.0 -> 2.0.0");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
