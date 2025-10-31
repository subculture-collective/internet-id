import { existsSync } from "fs";
import { ethers } from "ethers";
import { ConfigManager } from "../config";
import { sha256HexFromFile, fetchManifest } from "../utils";

export async function verifyCommand(
  input: string,
  options: Record<string, string | undefined>
): Promise<void> {
  console.log("🔍 Internet ID Verify\n");

  const config = new ConfigManager();
  const rpcUrl = options.rpcUrl || config.get("rpcUrl");
  const registryAddress = options.registry || config.get("registryAddress");

  if (!rpcUrl) {
    console.error("❌ Error: RPC URL not configured. Run: internet-id init");
    process.exit(1);
  }

  if (!registryAddress) {
    console.error("❌ Error: Registry address not configured. Run: internet-id init");
    process.exit(1);
  }

  try {
    let contentHash: string;
    let manifestUri: string;

    // Determine if input is a file path or manifest URI
    if (existsSync(input)) {
      // Input is a file path
      console.log("1️⃣  Computing content hash from file...");
      contentHash = await sha256HexFromFile(input);
      console.log(`   Content hash: ${contentHash}`);

      // Get manifest URI from on-chain registry
      console.log("\n2️⃣  Fetching on-chain entry...");
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const abi = [
        "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      ];
      const registry = new ethers.Contract(registryAddress, abi, provider);
      const entry = await registry.entries(contentHash);

      if (entry.creator === ethers.ZeroAddress) {
        console.error(`\n❌ Verification Failed: Content not registered on-chain`);
        process.exit(1);
      }

      manifestUri = entry.manifestURI;
      console.log(`   Creator: ${entry.creator}`);
      console.log(`   Manifest URI: ${manifestUri}`);
      console.log(`   Registered at: ${new Date(Number(entry.timestamp) * 1000).toISOString()}`);
    } else {
      // Input is a manifest URI
      manifestUri = input;
      console.log("1️⃣  Using provided manifest URI...");
      console.log(`   Manifest URI: ${manifestUri}`);
    }

    // Fetch and verify manifest
    console.log("\n3️⃣  Fetching manifest...");
    const manifest = await fetchManifest(manifestUri);
    contentHash = manifest.content_hash as string;
    console.log(`   Content hash from manifest: ${contentHash}`);
    console.log(`   Creator DID: ${manifest.creator_did}`);
    console.log(`   Created at: ${manifest.created_at}`);

    // Verify signature
    console.log("\n4️⃣  Verifying signature...");
    const messageBytes = ethers.getBytes(contentHash);
    const recoveredAddress = ethers.verifyMessage(messageBytes, manifest.signature as string);
    console.log(`   Recovered signer: ${recoveredAddress}`);

    // Verify on-chain
    console.log("\n5️⃣  Verifying on-chain...");
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const abi = [
      "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
    ];
    const registry = new ethers.Contract(registryAddress, abi, provider);
    const entry = await registry.entries(contentHash);

    if (entry.creator === ethers.ZeroAddress) {
      console.error(`\n❌ Verification Failed: Content not registered on-chain`);
      process.exit(1);
    }

    // Check if creator matches
    const isValid =
      entry.creator.toLowerCase() === recoveredAddress.toLowerCase() &&
      entry.contentHash === contentHash &&
      entry.manifestURI === manifestUri;

    if (isValid) {
      console.log(`   On-chain creator: ${entry.creator}`);
      console.log(`   On-chain hash: ${entry.contentHash}`);
      console.log(`   On-chain manifest URI: ${entry.manifestURI}`);
      console.log(`   Registered at: ${new Date(Number(entry.timestamp) * 1000).toISOString()}`);

      console.log("\n✅ Verification Successful!\n");
      console.log("📝 Summary:");
      console.log(`   ✓ Content hash matches manifest`);
      console.log(`   ✓ Signature is valid`);
      console.log(`   ✓ On-chain entry matches`);
      console.log(`   ✓ Creator: ${entry.creator}`);
    } else {
      console.error("\n❌ Verification Failed: Data mismatch");
      console.log(`   Manifest signer: ${recoveredAddress}`);
      console.log(`   On-chain creator: ${entry.creator}`);
      console.log(`   Match: ${entry.creator.toLowerCase() === recoveredAddress.toLowerCase()}`);
      process.exit(1);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Error: ${errorMessage}`);
    process.exit(1);
  }
}
