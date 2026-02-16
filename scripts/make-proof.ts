import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { ethers } from "ethers";
import * as https from "https";
import * as dotenv from "dotenv";
dotenv.config();

/*
Usage:
  npm run proof -- <filePath> <manifestURI> <registryAddress> [rpcUrl]

Generates proof.json with:
  - file hash
  - manifest details + signature recovery
  - on-chain entry
  - optional registration tx (best-effort)
*/

function sha256Hex(buf: Buffer) {
  return "0x" + createHash("sha256").update(buf).digest("hex");
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

async function fetchManifest(uri: string): Promise<any> {
  if (uri.startsWith("ipfs://")) {
    const path = uri.replace("ipfs://", "");
    const url = `https://ipfs.io/ipfs/${path}`;
    return fetchHttpsJson(url);
  }
  if (uri.startsWith("https://") || uri.startsWith("http://")) {
    return fetchHttpsJson(uri);
  }
  throw new Error("Unsupported manifest URI scheme: " + uri);
}

async function recoverSigner(contentHash: string, signature: string) {
  return ethers.verifyMessage(ethers.getBytes(contentHash), signature);
}

function chainName(chainId: bigint | number) {
  const id = Number(chainId);
  if (id === 84532) return "base-sepolia";
  if (id === 8453) return "base";
  if (id === 31337) return "localhost";
  return "unknown";
}

async function findRegistrationTx(
  provider: ethers.JsonRpcProvider,
  registry: string,
  contentHash: string
) {
  // Event: ContentRegistered(bytes32 indexed contentHash, address indexed creator, string manifestURI, uint64 timestamp)
  const topic0 = ethers.id("ContentRegistered(bytes32,address,string,uint64)");
  try {
    // Use a reasonable starting block to avoid scanning entire chain history
    // Default to recent blocks (e.g., last 1M blocks) or use env variable for contract deployment block
    const startBlock = process.env.REGISTRY_START_BLOCK 
      ? parseInt(process.env.REGISTRY_START_BLOCK, 10) 
      : Math.max(0, (await provider.getBlockNumber()) - 1000000);
    
    const logs = await provider.getLogs({
      address: registry,
      fromBlock: startBlock,
      toBlock: "latest",
      topics: [topic0, contentHash],
    });
    if (logs.length === 0) return null;
    const log = logs[logs.length - 1];
    return { txHash: log.transactionHash, blockNumber: log.blockNumber };
  } catch {
    return null;
  }
}

async function main() {
  const [filePath, manifestURI, registryAddress, rpcUrl] = process.argv.slice(2);
  if (!filePath || !manifestURI || !registryAddress) {
    console.error("Usage: npm run proof -- <filePath> <manifestURI> <registryAddress> [rpcUrl]");
    process.exit(1);
  }

  const file = readFileSync(filePath);
  const fileHash = sha256Hex(file);

  const manifest = await fetchManifest(manifestURI);
  const manifestHashOk = manifest.content_hash === fileHash;
  const recovered = await recoverSigner(manifest.content_hash, manifest.signature);

  const provider = new ethers.JsonRpcProvider(
    rpcUrl || process.env.RPC_URL || "https://sepolia.base.org"
  );
  const net = await provider.getNetwork();
  const abi = [
    "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
  ];
  const registry = new ethers.Contract(registryAddress, abi, provider);
  const entry = await registry.entries(fileHash);
  const creatorOk = (entry?.creator || "").toLowerCase() === recovered.toLowerCase();
  const manifestOk = entry?.manifestURI === manifestURI;

  const tx = await findRegistrationTx(provider, registryAddress, fileHash);

  const now = new Date().toISOString();
  const cid = manifestURI.startsWith("ipfs://") ? manifestURI.replace("ipfs://", "") : undefined;
  const proof = {
    version: "1.0",
    generated_at: now,
    network: {
      chainId: Number(net.chainId),
      name: chainName(net.chainId),
      rpc: rpcUrl || process.env.RPC_URL || "https://sepolia.base.org",
    },
    registry: registryAddress,
    content: {
      file: path.basename(filePath),
      hash: fileHash,
    },
    manifest: {
      uri: manifestURI,
      cid,
      creator_did: manifest.creator_did,
      signature: manifest.signature,
    },
    onchain: {
      creator: entry.creator,
      manifestURI: entry.manifestURI,
      timestamp: Number(entry.timestamp || 0),
    },
    signature: {
      recovered,
      valid: creatorOk,
    },
    tx: tx || undefined,
    verification: {
      fileHashMatchesManifest: manifestHashOk,
      creatorMatchesOnchain: creatorOk,
      manifestURIMatchesOnchain: manifestOk,
      status:
        manifestHashOk && creatorOk && manifestOk
          ? "OK"
          : manifestHashOk && creatorOk
            ? "WARN"
            : "FAIL",
    },
  };

  const out = "proof.json";
  writeFileSync(out, JSON.stringify(proof, null, 2));
  console.log("Wrote", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
