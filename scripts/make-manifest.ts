import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

/*
Usage:
  Preferred (no secret in CLI args):
    Set PRIVATE_KEY in .env, then run
      npm run manifest -- <contentFile> <contentURI>

  Or explicit key (less secure, appears in shell history):
      npm run manifest -- <contentFile> <contentURI> <creatorPrivateKey>

Writes manifest.json in cwd and prints path.
*/

function sign(hashHex: string, pk: string) {
  const wallet = new ethers.Wallet(pk);
  const msg = ethers.getBytes(hashHex);
  return wallet.signMessage(msg);
}

async function main() {
  const [contentPath, contentURI, maybePk] = process.argv.slice(2);
  const creatorPK = maybePk || process.env.PRIVATE_KEY;
  if (!contentPath || !contentURI || !creatorPK) {
    console.error(
      "Usage: set PRIVATE_KEY in .env and run: npm run manifest -- <contentFile> <contentURI>\n" +
        "Or pass the key explicitly (less secure): npm run manifest -- <contentFile> <contentURI> <creatorPrivateKey>"
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
