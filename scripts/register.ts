import { createHash } from "crypto";
import { readFileSync } from "fs";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [filePath, manifestURI, maybeAddress] = process.argv.slice(2);
  const registryAddress = maybeAddress || process.env.REGISTRY_ADDRESS;
  if (!filePath || !manifestURI || !registryAddress) {
    console.error(
      "Usage: set REGISTRY_ADDRESS in .env and run: npm run register -- <filePath> <manifestURI>\n" +
        "Or pass the address explicitly: npm run register -- <filePath> <manifestURI> <registryAddress>"
    );
    process.exit(1);
  }

  const data = readFileSync(filePath);
  const sha256 = createHash("sha256").update(data).digest("hex");
  const contentHash = "0x" + sha256;

  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL || "https://sepolia.base.org"
  );
  if (!process.env.PRIVATE_KEY) {
    console.error("Missing PRIVATE_KEY in .env");
    process.exit(1);
  }
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const abi = [
    "function register(bytes32 contentHash, string manifestURI) external",
    "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
  ];
  const registry = new ethers.Contract(registryAddress, abi, wallet);

  const tx = await registry.register(contentHash, manifestURI);
  const receipt = await tx.wait();
  console.log("Registered:", {
    contentHash,
    manifestURI,
    txHash: receipt?.hash,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
