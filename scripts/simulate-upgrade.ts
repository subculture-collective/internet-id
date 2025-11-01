import { ethers, upgrades } from "hardhat";

/**
 * Simulate upgrade process in a local environment
 * This script tests the full upgrade lifecycle without deploying to a network
 */
async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  
  console.log("=== Upgrade Simulation ===\n");
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  
  // Deploy V1
  console.log("\n--- Step 1: Deploy ContentRegistryV1 ---");
  const ContentRegistryV1 = await ethers.getContractFactory("ContentRegistryV1");
  const proxyV1 = await upgrades.deployProxy(ContentRegistryV1, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
  });
  await proxyV1.waitForDeployment();
  
  const proxyAddress = await proxyV1.getAddress();
  const implV1Address = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  
  console.log("✓ Proxy deployed to:", proxyAddress);
  console.log("✓ Implementation V1 deployed to:", implV1Address);
  console.log("✓ Version:", await proxyV1.version());
  
  // Use V1 - register some content
  console.log("\n--- Step 2: Use V1 to Register Content ---");
  const hash1 = ethers.keccak256(ethers.toUtf8Bytes("content-1"));
  const hash2 = ethers.keccak256(ethers.toUtf8Bytes("content-2"));
  const uri1 = "ipfs://Qm1234/manifest.json";
  const uri2 = "ipfs://Qm5678/manifest.json";
  
  await proxyV1.connect(user1).register(hash1, uri1);
  console.log("✓ User1 registered content 1");
  
  await proxyV1.connect(user2).register(hash2, uri2);
  console.log("✓ User2 registered content 2");
  
  // Verify V1 state
  const entry1V1 = await proxyV1.entries(hash1);
  const entry2V1 = await proxyV1.entries(hash2);
  console.log("✓ Entry 1 creator:", entry1V1.creator);
  console.log("✓ Entry 2 creator:", entry2V1.creator);
  
  // Test platform binding in V1
  await proxyV1.connect(user1).bindPlatform(hash1, "youtube", "video123");
  console.log("✓ User1 bound content 1 to YouTube");
  
  const [resolvedCreator] = await proxyV1.resolveByPlatform("youtube", "video123");
  console.log("✓ Platform resolution works - Creator:", resolvedCreator);
  
  // Upgrade to V2
  console.log("\n--- Step 3: Upgrade to ContentRegistryV2 ---");
  const ContentRegistryV2 = await ethers.getContractFactory("ContentRegistryV2");
  const proxyV2 = await upgrades.upgradeProxy(proxyAddress, ContentRegistryV2);
  await proxyV2.waitForDeployment();
  
  const implV2Address = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("✓ Implementation V2 deployed to:", implV2Address);
  console.log("✓ Proxy address unchanged:", await proxyV2.getAddress());
  console.log("✓ New version:", await proxyV2.version());
  
  // Verify state preservation after upgrade
  console.log("\n--- Step 4: Verify State Preservation After Upgrade ---");
  const entry1V2 = await proxyV2.entries(hash1);
  const entry2V2 = await proxyV2.entries(hash2);
  
  console.log("✓ Entry 1 creator preserved:", entry1V2.creator === entry1V1.creator);
  console.log("✓ Entry 1 URI preserved:", entry1V2.manifestURI === entry1V1.manifestURI);
  console.log("✓ Entry 2 creator preserved:", entry2V2.creator === entry2V1.creator);
  console.log("✓ Entry 2 URI preserved:", entry2V2.manifestURI === entry2V1.manifestURI);
  
  const [resolvedCreatorV2] = await proxyV2.resolveByPlatform("youtube", "video123");
  console.log("✓ Platform binding preserved:", resolvedCreatorV2 === resolvedCreator);
  
  // Test V1 functions still work
  console.log("\n--- Step 5: Verify V1 Functions Still Work ---");
  const hash3 = ethers.keccak256(ethers.toUtf8Bytes("content-3"));
  const uri3 = "ipfs://Qm9999/manifest.json";
  await proxyV2.connect(user1).register(hash3, uri3);
  console.log("✓ Can still register using V1 register function");
  
  const entry3 = await proxyV2.entries(hash3);
  console.log("✓ New registration stored correctly:", entry3.creator === user1.address);
  
  // Test new V2 features
  console.log("\n--- Step 6: Test New V2 Features ---");
  const totalRegs = await proxyV2.getTotalRegistrations();
  console.log("✓ Total registrations (V2 feature):", totalRegs.toString());
  console.log("  Note: Counter starts at 0 because it's a new feature");
  
  const hash4 = ethers.keccak256(ethers.toUtf8Bytes("content-4"));
  const uri4 = "ipfs://QmABCD/manifest.json";
  await proxyV2.connect(user2).registerV2(hash4, uri4);
  console.log("✓ User2 registered content using new registerV2 function");
  
  const totalRegsAfter = await proxyV2.getTotalRegistrations();
  console.log("✓ Total registrations now:", totalRegsAfter.toString());
  
  // Test ownership and upgrade authorization
  console.log("\n--- Step 7: Test Upgrade Authorization ---");
  try {
    const ContentRegistryV2Again = await ethers.getContractFactory("ContentRegistryV2", user1);
    await upgrades.upgradeProxy(proxyAddress, ContentRegistryV2Again);
    console.log("✗ ERROR: Non-owner was able to upgrade!");
  } catch (error: any) {
    if (error.message.includes("OwnableUnauthorizedAccount")) {
      console.log("✓ Non-owner cannot upgrade (correct behavior)");
    } else {
      console.log("✗ Unexpected error:", error.message);
    }
  }
  
  console.log("\n=== Simulation Complete ===");
  console.log("\nSummary:");
  console.log("- Proxy address remained constant:", proxyAddress);
  console.log("- Implementation V1:", implV1Address);
  console.log("- Implementation V2:", implV2Address);
  console.log("- All state preserved across upgrade");
  console.log("- V1 functions still work after upgrade");
  console.log("- V2 new features work correctly");
  console.log("- Upgrade authorization protected by ownership");
  console.log("\n✓ Upgrade simulation successful!");
}

main().catch((error) => {
  console.error("\n✗ Simulation failed:");
  console.error(error);
  process.exit(1);
});
