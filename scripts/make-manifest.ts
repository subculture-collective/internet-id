import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

/*
Usage:
  npm run manifest -- <contentFile> <contentURI> <creatorPrivateKey>
Writes manifest.json in cwd and prints path.
*/

function sign(hashHex: string, pk: string) {
  const wallet = new ethers.Wallet(pk);
  const msg = ethers.getBytes(hashHex);
  return wallet.signMessage(msg);
}

async function main() {
  const [contentPath, contentURI, creatorPK] = process.argv.slice(2);
  if (!contentPath || !contentURI || !creatorPK) {
    console.error(
      "Usage: npm run manifest -- <contentFile> <contentURI> <creatorPrivateKey>"
    );
    process.exit(1);
  }
  const data = readFileSync(contentPath);
  const sha256 = createHash("sha256").update(data).digest("hex");
  const contentHash = "0x" + sha256;

  const signature = await sign(contentHash, creatorPK);

  const manifest = {
    version: "1.0",
    algorithm: "sha256",
    content_hash: contentHash,
    content_uri: contentURI,
    creator_did: `did:pkh:eip155:84532:${new ethers.Wallet(creatorPK).address}`,
    created_at: new Date().toISOString(),
    signature,
    attestations: [] as any[],
  };

  const outPath = "manifest.json";
  writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log("Wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
