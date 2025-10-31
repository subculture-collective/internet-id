import { readFileSync, existsSync } from "fs";
import { ethers } from "ethers";
import { ConfigManager } from "../config";
import { sha256HexFromFile, signMessage, getAddress, uploadToIpfs, createManifest } from "../utils";

export async function uploadCommand(filePath: string, options: any): Promise<void> {
  console.log("📤 Internet ID Upload & Register\n");

  // Validate file exists
  if (!existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  // Load configuration
  const config = new ConfigManager();
  const privateKey = options.privateKey || config.get("privateKey");
  const rpcUrl = options.rpcUrl || config.get("rpcUrl");
  const registryAddress = options.registry || config.get("registryAddress");
  const ipfsProvider = (options.ipfsProvider || config.get("ipfsProvider")) as any;

  if (!privateKey) {
    console.error("❌ Error: Private key not configured. Run: internet-id init");
    process.exit(1);
  }

  if (!rpcUrl) {
    console.error("❌ Error: RPC URL not configured. Run: internet-id init");
    process.exit(1);
  }

  if (!registryAddress) {
    console.error("❌ Error: Registry address not configured. Run: internet-id init");
    process.exit(1);
  }

  try {
    // Step 1: Compute content hash
    console.log("1️⃣  Computing content hash...");
    const contentHash = await sha256HexFromFile(filePath);
    console.log(`   Content hash: ${contentHash}`);

    // Step 2: Upload file to IPFS (optional)
    let contentCid: string | undefined;
    if (options.uploadContent) {
      console.log("\n2️⃣  Uploading content to IPFS...");
      const credentials = {
        web3StorageToken: config.get("web3StorageToken"),
        pinataJwt: config.get("pinataJwt"),
        infuraProjectId: config.get("infuraProjectId"),
        infuraProjectSecret: config.get("infuraProjectSecret"),
        ipfsApiUrl: config.get("ipfsApiUrl"),
      };
      contentCid = await uploadToIpfs(filePath, ipfsProvider, credentials);
      console.log(`   Content CID: ${contentCid}`);
    } else {
      console.log("\n2️⃣  Skipping content upload (privacy mode)");
    }

    // Step 3: Create and sign manifest
    console.log("\n3️⃣  Creating manifest...");
    const creatorAddress = getAddress(privateKey);
    const signature = await signMessage(contentHash, privateKey);
    const contentUri = contentCid ? `ipfs://${contentCid}` : "";
    const manifest = createManifest(contentHash, contentUri, creatorAddress, signature);
    console.log(`   Creator: ${creatorAddress}`);

    // Step 4: Upload manifest to IPFS
    console.log("\n4️⃣  Uploading manifest to IPFS...");
    const manifestJson = JSON.stringify(manifest, null, 2);
    const manifestPath = `/tmp/manifest-${Date.now()}.json`;
    require("fs").writeFileSync(manifestPath, manifestJson);

    const credentials = {
      web3StorageToken: config.get("web3StorageToken"),
      pinataJwt: config.get("pinataJwt"),
      infuraProjectId: config.get("infuraProjectId"),
      infuraProjectSecret: config.get("infuraProjectSecret"),
      ipfsApiUrl: config.get("ipfsApiUrl"),
    };
    const manifestCid = await uploadToIpfs(manifestPath, ipfsProvider, credentials);
    const manifestUri = `ipfs://${manifestCid}`;
    console.log(`   Manifest URI: ${manifestUri}`);

    // Step 5: Register on-chain
    console.log("\n5️⃣  Registering on-chain...");
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const abi = [
      "function register(bytes32 contentHash, string manifestURI) external",
      "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
    ];
    const registry = new ethers.Contract(registryAddress, abi, wallet);

    const tx = await registry.register(contentHash, manifestUri);
    console.log(`   Transaction sent: ${tx.hash}`);
    console.log("   Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log(`   ✅ Confirmed in block ${receipt?.blockNumber}`);

    // Summary
    console.log("\n✅ Upload & Registration Complete!\n");
    console.log("📝 Summary:");
    console.log(`   Content Hash: ${contentHash}`);
    if (contentCid) {
      console.log(`   Content URI: ipfs://${contentCid}`);
    }
    console.log(`   Manifest URI: ${manifestUri}`);
    console.log(`   Transaction: ${receipt?.hash}`);
    console.log(`   Registry: ${registryAddress}`);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message || error}`);
    process.exit(1);
  }
}
