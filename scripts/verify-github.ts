import { ethers } from "ethers";
import * as https from "https";
import { extractGitHubId } from "./services/platform.service";

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

async function fetchManifest(manifestURI: string): Promise<any> {
  if (!manifestURI) throw new Error("Empty manifestURI");
  if (manifestURI.startsWith("ipfs://")) {
    const path = manifestURI.replace("ipfs://", "");
    return fetchHttpsJson(`https://ipfs.io/ipfs/${path}`);
  } else if (manifestURI.startsWith("http://") || manifestURI.startsWith("https://")) {
    return fetchHttpsJson(manifestURI);
  } else {
    throw new Error("Unsupported manifest URI scheme");
  }
}

async function main() {
  const [githubUrlOrId, registryAddress] = process.argv.slice(2);
  if (!githubUrlOrId || !registryAddress) {
    console.error("Usage: npm run verify:github -- <githubUrlOrId> <registryAddress>");
    process.exit(1);
  }

  const githubId = extractGitHubId(githubUrlOrId);
  if (!githubId) {
    console.error("Could not extract GitHub ID");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL || process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545"
  );
  const abi = [
    "function resolveByPlatform(string platform, string platformId) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
  ];
  const registry = new ethers.Contract(registryAddress, abi, provider);

  const { creator, contentHash, manifestURI, timestamp } = await registry.resolveByPlatform(
    "github",
    githubId
  );
  if (!timestamp || contentHash === ethers.ZeroHash) {
    console.error("FAIL: No binding found on-chain for this GitHub ID");
    process.exit(1);
  }

  const manifest = await fetchManifest(manifestURI);
  const manifestHash = String(manifest.content_hash || "").toLowerCase();
  const onchainHash = String(contentHash).toLowerCase();
  if (manifestHash !== onchainHash) {
    console.error("FAIL: Manifest content_hash does not match on-chain contentHash");
    console.error({ manifestHash, onchainHash, manifestURI });
    process.exit(1);
  }

  const sig = manifest.signature;
  if (!sig) {
    console.error("FAIL: Manifest signature missing");
    process.exit(1);
  }
  const bytes = Buffer.from(onchainHash.replace(/^0x/, ""), "hex");
  const recovered = ethers.verifyMessage(bytes, sig).toLowerCase();
  if (recovered !== String(creator).toLowerCase()) {
    console.error("FAIL: Signature does not recover on-chain creator");
    console.error({ recovered, creator });
    process.exit(1);
  }

  console.log("OK: verified", {
    platform: "github",
    githubId,
    creator,
    contentHash: onchainHash,
    manifestURI,
    timestamp: Number(timestamp),
  });
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { extractGitHubId };
