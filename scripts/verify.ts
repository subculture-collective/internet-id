import { createHash } from "crypto";
import { readFileSync } from "fs";
import { ethers } from "ethers";
import * as https from "https";

/*
Usage:
  ts-node scripts/verify.ts <filePath> <manifestURI> <registryAddress> [rpcUrl]

- Computes sha256(file) and compares to manifest.content_hash
- Downloads manifest (ipfs:// or https://) and verifies the creator signature
- Reads on-chain registry entry and compares hash, creator and manifestURI
*/

function sha256Hex(buf: Buffer) {
  return "0x" + createHash("sha256").update(buf).digest("hex");
}

async function fetchManifest(uri: string): Promise<any> {
  if (uri.startsWith("ipfs://")) {
    // Use a public gateway for verification fetch
    const path = uri.replace("ipfs://", "");
    const url = `https://ipfs.io/ipfs/${path}`;
    return fetchHttpsJson(url);
  }
  if (uri.startsWith("https://") || uri.startsWith("http://")) {
    return fetchHttpsJson(uri);
  }
  throw new Error("Unsupported manifest URI scheme: " + uri);
}

function fetchHttpsJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function verifySignature(manifest: any) {
  const { content_hash, signature } = manifest;
  const recovered = ethers.verifyMessage(ethers.getBytes(content_hash), signature);
  return recovered.toLowerCase();
}

async function main() {
  const [filePath, manifestURI, registryAddress, rpcUrl] = process.argv.slice(2);
  if (!filePath || !manifestURI || !registryAddress) {
    console.error(
      "Usage: ts-node scripts/verify.ts <filePath> <manifestURI> <registryAddress> [rpcUrl]"
    );
    process.exit(1);
  }

  const file = readFileSync(filePath);
  const fileHash = sha256Hex(file);

  const manifest = await fetchManifest(manifestURI);
  if (manifest.content_hash !== fileHash) {
    console.error("FAIL: content hash mismatch", {
      fileHash,
      manifestHash: manifest.content_hash,
    });
    process.exit(2);
  }

  const recoveredAddress = await verifySignature(manifest);

  const url = rpcUrl || process.env.RPC_URL;
  if (!url) {
    throw new Error(
      "RPC_URL is required. Set RPC_URL environment variable or provide --rpc-url argument."
    );
  }

  const provider = new ethers.JsonRpcProvider(url);
  const abi = [
    "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
  ];
  const registry = new ethers.Contract(registryAddress, abi, provider);
  const entry = await registry.entries(fileHash);

  const creatorOk = entry.creator.toLowerCase() === recoveredAddress.toLowerCase();
  const manifestOk = entry.manifestURI === manifestURI;

  if (!entry.creator || entry.creator === ethers.ZeroAddress) {
    console.error("FAIL: no on-chain entry for hash");
    process.exit(3);
  }

  if (!creatorOk) {
    console.error("FAIL: creator signature does not match on-chain entry", {
      onchain: entry.creator,
      recoveredAddress,
    });
    process.exit(4);
  }

  if (!manifestOk) {
    console.error("WARN: on-chain manifest URI differs", {
      onchain: entry.manifestURI,
      manifestURI,
    });
  }

  console.log("OK: verified", {
    creator: entry.creator,
    hash: fileHash,
    manifestURI,
    timestamp: Number(entry.timestamp),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
