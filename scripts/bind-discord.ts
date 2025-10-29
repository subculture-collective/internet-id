import { createHash } from "crypto";
import { readFileSync } from "fs";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { extractDiscordId } from "./services/platform.service";
dotenv.config();

async function main() {
  const [filePath, discordId, registryAddress] = process.argv.slice(2);
  if (!filePath || !discordId || !registryAddress) {
    console.error(
      "Usage: npm run bind:discord -- <masterFilePath> <discordId> <registryAddress>"
    );
    process.exit(1);
  }

  const data = readFileSync(filePath);
  const sha256 = createHash("sha256").update(data).digest("hex");
  const contentHash = "0x" + sha256;

  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL || process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545"
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

  const abi = [
    "function bindPlatform(bytes32 contentHash, string platform, string platformId) external",
    "function entries(bytes32) view returns (address, bytes32, string memory, uint64)",
  ];
  const registry = new ethers.Contract(registryAddress, abi, wallet);

  const platformId = extractDiscordId(discordId);
  const tx = await registry.bindPlatform(contentHash, "discord", platformId);
  const receipt = await tx.wait();
  console.log("Bound Discord ID to contentHash:", {
    discordId: platformId,
    contentHash,
    txHash: receipt?.hash,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
