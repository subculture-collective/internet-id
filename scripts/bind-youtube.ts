import { createHash } from "crypto";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
import { createProviderAndWallet, createRegistryContract } from "./services/blockchain.service";
import { BIND_PLATFORM_ABI } from "./constants/abi";
dotenv.config();

async function main() {
  const [filePath, videoId, registryAddress] = process.argv.slice(2);
  if (!filePath || !videoId || !registryAddress) {
    console.error(
      "Usage: npm run bind:youtube -- <masterFilePath> <youtubeVideoId> <registryAddress>"
    );
    process.exit(1);
  }

  const data = readFileSync(filePath);
  const sha256 = createHash("sha256").update(data).digest("hex");
  const contentHash = "0x" + sha256;

  const { wallet } = createProviderAndWallet(
    process.env.PRIVATE_KEY,
    process.env.RPC_URL || process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545"
  );
  const registry = createRegistryContract(registryAddress, BIND_PLATFORM_ABI, wallet);

  const tx = await registry.bindPlatform(contentHash, "youtube", videoId);
  const receipt = await tx.wait();
  console.log("Bound YouTube videoId to contentHash:", {
    videoId,
    contentHash,
    txHash: receipt?.hash,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
