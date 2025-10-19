import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { writeFile, unlink, readFile } from "fs/promises";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";
import * as os from "os";
import * as path from "path";
import { createHash } from "crypto";
import { ethers } from "ethers";
import * as https from "https";
import * as dotenv from "dotenv";
import { URL } from "url";
dotenv.config();

import { uploadToIpfs } from "./upload-ipfs";
import { prisma } from "./db";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

function requireApiKey(req: Request, res: Response, next: Function) {
  const expected = process.env.API_KEY;
  if (!expected) return next();
  const provided = req.header("x-api-key") || req.header("authorization");
  if (provided === expected) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// Use disk storage to prevent memory exhaustion
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (_req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${path.basename(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 1024 },
}); // up to 1GB

function sha256Hex(buf: Buffer) {
  return "0x" + createHash("sha256").update(buf).digest("hex");
}

// Stream-based hash computation to avoid loading entire file in memory
async function sha256HexFromFile(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  await pipeline(createReadStream(filePath), hash);
  return "0x" + hash.digest("hex");
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
    const p = uri.replace("ipfs://", "");
    return fetchHttpsJson(`https://ipfs.io/ipfs/${p}`);
  }
  if (uri.startsWith("http://") || uri.startsWith("https://"))
    return fetchHttpsJson(uri);
  throw new Error("Unsupported manifest URI");
}

async function tmpWrite(originalName: string, buf: Buffer) {
  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${path.basename(originalName)}`;
  const tmpPath = path.join(os.tmpdir(), filename);
  await writeFile(tmpPath, buf);
  return tmpPath;
}

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Network info (for UI explorer links)
app.get("/api/network", async (_req: Request, res: Response) => {
  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "https://sepolia.base.org"
    );
    const net = await provider.getNetwork();
    res.json({ chainId: Number(net.chainId) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Helper to resolve default registry address for current network
async function resolveDefaultRegistry(): Promise<{
  registryAddress: string;
  chainId: number;
}> {
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL || "https://sepolia.base.org"
  );
  const net = await provider.getNetwork();
  const chainId = Number(net.chainId);
  const override = process.env.REGISTRY_ADDRESS;
  if (override) return { registryAddress: override, chainId };
  let deployedFile: string | undefined;
  if (chainId === 84532)
    deployedFile = path.join(process.cwd(), "deployed", "baseSepolia.json");
  if (deployedFile) {
    try {
      const data = JSON.parse((await readFile(deployedFile)).toString("utf8"));
      if (data?.address) return { registryAddress: data.address, chainId };
    } catch {}
  }
  throw new Error("Registry address not configured");
}

// Parse platform input from a URL or explicit platform/platformId
function parsePlatformInput(
  input?: string,
  platform?: string,
  platformId?: string
): { platform: string; platformId: string } | null {
  if (platform && platformId)
    return { platform: platform.toLowerCase(), platformId };
  if (!input) return null;
  try {
    const u = new URL(input);
    const host = u.hostname.replace(/^www\./, "");
    // YouTube
    if (host.includes("youtube.com") || host === "youtu.be") {
      const id =
        u.searchParams.get("v") ||
        (host === "youtu.be"
          ? u.pathname.replace(/^\//, "")
          : u.pathname.split("/").filter(Boolean).pop() || "");
      return { platform: "youtube", platformId: id || input };
    }
    // TikTok
    if (host.includes("tiktok.com")) {
      const p = u.pathname.replace(/^\/+/, "").replace(/\/$/, "");
      return { platform: "tiktok", platformId: p || input };
    }
    // X/Twitter
    if (host.includes("x.com") || host.includes("twitter.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const statusIdx = parts.findIndex((p) => p === "status");
      if (statusIdx >= 0 && parts[statusIdx + 1])
        return { platform: "x", platformId: parts[statusIdx + 1] };
      return { platform: "x", platformId: parts.join("/") || input };
    }
    // Instagram
    if (host.includes("instagram.com")) {
      return {
        platform: "instagram",
        platformId: u.pathname.replace(/^\/+/, "").replace(/\/$/, ""),
      };
    }
    // Vimeo
    if (host.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop() || "";
      return { platform: "vimeo", platformId: id || input };
    }
    // Fallback: generic
    return { platform: host.split(".")[0] || "generic", platformId: input };
  } catch {
    // Not a URL; accept raw as platformId
    return { platform: "generic", platformId: input };
  }
}

// Resolve binding by URL or platform+platformId
app.get("/api/resolve", async (req: Request, res: Response) => {
  try {
    const url = (req.query as any).url as string | undefined;
    const platform = (req.query as any).platform as string | undefined;
    const platformId = (req.query as any).platformId as string | undefined;
    const parsed = parsePlatformInput(url, platform, platformId);
    if (!parsed?.platform || !parsed.platformId) {
      return res
        .status(400)
        .json({ error: "Provide url or platform + platformId" });
    }
    const { registryAddress, chainId } = await resolveDefaultRegistry();
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "https://sepolia.base.org"
    );
    const abi = [
      "function resolveByPlatform(string,string) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
    ];
    const registry = new ethers.Contract(registryAddress, abi, provider);
    const entry = await registry.resolveByPlatform(
      parsed.platform,
      parsed.platformId
    );
    const creator: string = (entry?.creator || ethers.ZeroAddress) as string;
    if (creator === ethers.ZeroAddress)
      return res
        .status(404)
        .json({
          error: "No binding found",
          ...parsed,
          registryAddress,
          chainId,
        });
    const contentHash = entry.contentHash as string;
    const manifestURI = entry.manifestURI as string;
    const timestamp = Number(entry.timestamp || 0);
    return res.json({
      ...parsed,
      creator,
      contentHash,
      manifestURI,
      timestamp,
      registryAddress,
      chainId,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

// Public verify: resolve + include manifest JSON if on IPFS/HTTP
app.get("/api/public-verify", async (req: Request, res: Response) => {
  try {
    const url = (req.query as any).url as string | undefined;
    const platform = (req.query as any).platform as string | undefined;
    const platformId = (req.query as any).platformId as string | undefined;
    const parsed = parsePlatformInput(url, platform, platformId);
    if (!parsed?.platform || !parsed.platformId) {
      return res
        .status(400)
        .json({ error: "Provide url or platform + platformId" });
    }
    const { registryAddress, chainId } = await resolveDefaultRegistry();
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "https://sepolia.base.org"
    );
    const abi = [
      "function resolveByPlatform(string,string) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
    ];
    const registry = new ethers.Contract(registryAddress, abi, provider);
    const entry = await registry.resolveByPlatform(
      parsed.platform,
      parsed.platformId
    );
    const creator: string = (entry?.creator || ethers.ZeroAddress) as string;
    if (creator === ethers.ZeroAddress)
      return res
        .status(404)
        .json({
          error: "No binding found",
          ...parsed,
          registryAddress,
          chainId,
        });
    const contentHash = entry.contentHash as string;
    const manifestURI = entry.manifestURI as string;
    const timestamp = Number(entry.timestamp || 0);
    // Fetch manifest for convenience
    let manifest: any = null;
    try {
      manifest = await fetchManifest(manifestURI);
    } catch {}
    return res.json({
      ...parsed,
      creator,
      contentHash,
      manifestURI,
      timestamp,
      registryAddress,
      chainId,
      manifest,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

// Default registry address for current network
app.get("/api/registry", async (_req: Request, res: Response) => {
  try {
    const override = process.env.REGISTRY_ADDRESS;
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "https://sepolia.base.org"
    );
    const net = await provider.getNetwork();
    const chainId = Number(net.chainId);
    if (override) return res.json({ registryAddress: override, chainId });

    // Attempt to map chainId to a deployed file in ./deployed
    let deployedFile: string | undefined;
    if (chainId === 84532)
      deployedFile = path.join(process.cwd(), "deployed", "baseSepolia.json");
    // Add more mappings here if other networks are deployed

    if (deployedFile) {
      try {
        const data = JSON.parse(
          (await readFile(deployedFile)).toString("utf8")
        );
        if (data?.address)
          return res.json({ registryAddress: data.address, chainId });
      } catch (e) {
        // fallthrough
      }
    }
    return res
      .status(404)
      .json({ error: "Registry address not configured", chainId });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Upload to IPFS
app.post(
  "/api/upload",
  requireApiKey as any,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file)
        return res.status(400).json({
          error: "file is required (multipart/form-data field 'file')",
        });
      // File is already on disk at req.file.path
      try {
        const cid = await uploadToIpfs(req.file.path);
        res.json({ cid, uri: `ipfs://${cid}` });
      } finally {
        // Clean up temp file
        await unlink(req.file.path).catch(() => {});
      }
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

// Create manifest (optionally upload it)
app.post(
  "/api/manifest",
  requireApiKey as any,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { contentUri, upload: doUpload } = req.body as {
        contentUri?: string;
        upload?: string;
      };
      if (!contentUri)
        return res.status(400).json({ error: "contentUri is required" });
      let fileHash: string | undefined = undefined;
      if (req.file) {
        // Hash from disk instead of memory
        fileHash = await sha256HexFromFile(req.file.path);
        // Clean up temp file
        await unlink(req.file.path).catch(() => {});
      } else if ((req.body as any).contentHash) {
        fileHash = (req.body as any).contentHash;
      } else {
        return res
          .status(400)
          .json({ error: "file (multipart) or contentHash is required" });
      }

      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );
      const net = await provider.getNetwork();
      const pk = process.env.PRIVATE_KEY;
      if (!pk)
        return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
      const wallet = new ethers.Wallet(pk);
      const signature = await wallet.signMessage(ethers.getBytes(fileHash!));
      const manifest = {
        version: "1.0",
        algorithm: "sha256",
        content_hash: fileHash,
        content_uri: contentUri,
        creator_did: `did:pkh:eip155:${Number(net.chainId)}:${wallet.address}`,
        created_at: new Date().toISOString(),
        signature,
        attestations: [] as any[],
      };

      if (String(doUpload).toLowerCase() === "true") {
        const tmpPath = await tmpWrite(
          "manifest.json",
          Buffer.from(JSON.stringify(manifest))
        );
        try {
          const cid = await uploadToIpfs(tmpPath);
          return res.json({ manifest, cid, uri: `ipfs://${cid}` });
        } finally {
          await unlink(tmpPath).catch(() => {});
        }
      }
      res.json({ manifest });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

// Register on-chain
app.post(
  "/api/register",
  requireApiKey as any,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { registryAddress, manifestURI } = req.body as {
        registryAddress?: string;
        manifestURI?: string;
      };
      if (!registryAddress || !manifestURI)
        return res
          .status(400)
          .json({ error: "registryAddress and manifestURI are required" });
      let fileHash: string | undefined;
      if (req.file) {
        fileHash = await sha256HexFromFile(req.file.path);
        // Clean up temp file
        await unlink(req.file.path).catch(() => {});
      } else if ((req.body as any).contentHash) {
        fileHash = (req.body as any).contentHash;
      } else {
        return res
          .status(400)
          .json({ error: "file (multipart) or contentHash is required" });
      }

      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );
      const pk = process.env.PRIVATE_KEY;
      if (!pk)
        return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
      const wallet = new ethers.Wallet(pk, provider);
      const abi = [
        "function register(bytes32 contentHash, string manifestURI) external",
        "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      ];
      const registry = new ethers.Contract(registryAddress, abi, wallet);
      const tx = await registry.register(fileHash, manifestURI);
      const receipt = await tx.wait();
      // upsert user by creatorAddress
      let creatorId: string | undefined = undefined;
      try {
        const address = (await wallet.getAddress()).toLowerCase();
        const user = await prisma.user.upsert({
          where: { address },
          create: { address },
          update: {},
        });
        creatorId = user.id;
      } catch (e) {
        console.warn("DB upsert user failed:", e);
      }
      // persist content record in DB
      try {
        await prisma.content.upsert({
          where: { contentHash: fileHash! },
          create: {
            contentHash: fileHash!,
            contentUri: undefined,
            manifestCid: manifestURI.startsWith("ipfs://")
              ? manifestURI.replace("ipfs://", "")
              : undefined,
            manifestUri: manifestURI,
            creatorAddress: (await wallet.getAddress()).toLowerCase(),
            creatorId,
            registryAddress,
            txHash: receipt?.hash || undefined,
          },
          update: {
            manifestCid: manifestURI.startsWith("ipfs://")
              ? manifestURI.replace("ipfs://", "")
              : undefined,
            manifestUri: manifestURI,
            registryAddress,
            txHash: receipt?.hash || undefined,
          },
        });
      } catch (e) {
        console.warn("DB upsert content failed:", e);
      }
      res.json({ txHash: receipt?.hash, contentHash: fileHash, manifestURI });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

// Users API (minimal)
app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const { address, email, name } = req.body as {
      address?: string;
      email?: string;
      name?: string;
    };
    const user = await prisma.user.create({
      data: {
        address: address || undefined,
        email: email || undefined,
        name: name || undefined,
      },
    });
    res.json(user);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

app.get("/api/contents", async (_req: Request, res: Response) => {
  try {
    const items = await prisma.content.findMany({
      orderBy: { createdAt: "desc" },
      include: { bindings: true },
    });
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Content detail by contentHash
app.get("/api/contents/:hash", async (req: Request, res: Response) => {
  try {
    const hash = req.params.hash;
    if (!hash) return res.status(400).json({ error: "hash is required" });
    const item = await prisma.content.findUnique({
      where: { contentHash: hash },
      include: { bindings: true },
    });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Verifications listing
app.get("/api/verifications", async (req: Request, res: Response) => {
  try {
    const { contentHash, limit } = req.query as {
      contentHash?: string;
      limit?: string;
    };
    const take = Math.max(1, Math.min(100, Number(limit || 50)));
    const items = await prisma.verification.findMany({
      where: contentHash ? { contentHash } : undefined,
      orderBy: { createdAt: "desc" },
      take,
    });
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Verification detail
app.get("/api/verifications/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const v = await prisma.verification.findUnique({ where: { id } });
    if (!v) return res.status(404).json({ error: "Not found" });
    res.json(v);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Verifications by contentHash
app.get(
  "/api/contents/:hash/verifications",
  async (req: Request, res: Response) => {
    try {
      const hash = req.params.hash;
      const items = await prisma.verification.findMany({
        where: { contentHash: hash },
        orderBy: { createdAt: "desc" },
      });
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

// Verify
app.post(
  "/api/verify",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { registryAddress, manifestURI, rpcUrl } = req.body as {
        registryAddress?: string;
        manifestURI?: string;
        rpcUrl?: string;
      };
      if (!registryAddress || !manifestURI)
        return res
          .status(400)
          .json({ error: "registryAddress and manifestURI are required" });
      if (!req.file)
        return res.status(400).json({
          error: "file is required (multipart/form-data field 'file')",
        });
      const fileHash = await sha256HexFromFile(req.file.path);
      // Clean up temp file
      await unlink(req.file.path).catch(() => {});
      
      const manifest = await fetchManifest(manifestURI);
      const manifestHashOk = manifest.content_hash === fileHash;
      const recovered = ethers.verifyMessage(
        ethers.getBytes(manifest.content_hash),
        manifest.signature
      );
      const provider = new ethers.JsonRpcProvider(
        rpcUrl || process.env.RPC_URL || "https://sepolia.base.org"
      );
      const abi = [
        "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      ];
      const registry = new ethers.Contract(registryAddress, abi, provider);
      const entry = await registry.entries(fileHash);
      const creatorOk =
        (entry?.creator || "").toLowerCase() === recovered.toLowerCase();
      const manifestOk = entry?.manifestURI === manifestURI;
      const status =
        manifestHashOk && creatorOk && manifestOk
          ? "OK"
          : manifestHashOk && creatorOk
          ? "WARN"
          : "FAIL";
      const result = {
        status,
        fileHash,
        recovered,
        onchain: entry,
        checks: { manifestHashOk, creatorOk, manifestOk },
      };
      // persist verification record
      try {
        const content = await prisma.content.findUnique({
          where: { contentHash: fileHash },
        });
        await prisma.verification.create({
          data: {
            contentHash: fileHash,
            manifestUri: manifestURI,
            recoveredAddress: recovered.toLowerCase(),
            creatorOnchain: (entry?.creator || "").toLowerCase(),
            status,
          },
        });
      } catch (e) {
        console.warn("DB insert verification failed:", e);
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

// Proof
app.post(
  "/api/proof",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { registryAddress, manifestURI, rpcUrl } = req.body as {
        registryAddress?: string;
        manifestURI?: string;
        rpcUrl?: string;
      };
      if (!registryAddress || !manifestURI)
        return res
          .status(400)
          .json({ error: "registryAddress and manifestURI are required" });
      if (!req.file)
        return res.status(400).json({
          error: "file is required (multipart/form-data field 'file')",
        });
      const originalName = req.file.originalname;
      const fileHash = await sha256HexFromFile(req.file.path);
      // Clean up temp file
      await unlink(req.file.path).catch(() => {});
      
      const manifest = await fetchManifest(manifestURI);
      const recovered = ethers.verifyMessage(
        ethers.getBytes(manifest.content_hash),
        manifest.signature
      );
      const provider = new ethers.JsonRpcProvider(
        rpcUrl || process.env.RPC_URL || "https://sepolia.base.org"
      );
      const net = await provider.getNetwork();
      const abi = [
        "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      ];
      const registry = new ethers.Contract(registryAddress, abi, provider);
      const entry = await registry.entries(fileHash);
      const creatorOk =
        (entry?.creator || "").toLowerCase() === recovered.toLowerCase();
      const manifestOk = entry?.manifestURI === manifestURI;
      const topic0 = ethers.id(
        "ContentRegistered(bytes32,address,string,uint64)"
      );
      let txHash: string | undefined;
      try {
        const logs = await provider.getLogs({
          address: registryAddress,
          fromBlock: 0,
          toBlock: "latest",
          topics: [topic0, fileHash],
        });
        if (logs.length) txHash = logs[logs.length - 1].transactionHash;
      } catch {}
      const proof = {
        version: "1.0",
        generated_at: new Date().toISOString(),
        network: { chainId: Number(net.chainId) },
        registry: registryAddress,
        content: { file: originalName, hash: fileHash },
        manifest: {
          uri: manifestURI,
          creator_did: manifest.creator_did,
          signature: manifest.signature,
        },
        onchain: {
          creator: entry.creator,
          manifestURI: entry.manifestURI,
          timestamp: Number(entry.timestamp || 0),
        },
        signature: { recovered, valid: creatorOk },
        tx: txHash ? { txHash } : undefined,
        verification: {
          fileHashMatchesManifest: manifest.content_hash === fileHash,
          creatorMatchesOnchain: creatorOk,
          manifestURIMatchesOnchain: manifestOk,
          status:
            manifest.content_hash === fileHash && creatorOk && manifestOk
              ? "OK"
              : manifest.content_hash === fileHash && creatorOk
              ? "WARN"
              : "FAIL",
        },
      };
      // persist verification as well
      try {
        const content = await prisma.content.findUnique({
          where: { contentHash: fileHash },
        });
        await prisma.verification.create({
          data: {
            contentHash: fileHash,
            manifestUri: manifestURI,
            recoveredAddress: recovered.toLowerCase(),
            creatorOnchain: (entry?.creator || "").toLowerCase(),
            status: proof.verification.status,
          },
        });
      } catch (e) {
        console.warn("DB insert verification (proof) failed:", e);
      }
      res.json(proof);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

// Bind platform and upsert DB binding
app.post(
  "/api/bind",
  requireApiKey as any,
  async (req: Request, res: Response) => {
    try {
      const { registryAddress, platform, platformId, contentHash } =
        req.body as {
          registryAddress?: string;
          platform?: string;
          platformId?: string;
          contentHash?: string;
        };
      if (!registryAddress || !platform || !platformId || !contentHash) {
        return res.status(400).json({
          error:
            "registryAddress, platform, platformId, contentHash are required",
        });
      }
      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );
      const pk = process.env.PRIVATE_KEY;
      if (!pk)
        return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
      const wallet = new ethers.Wallet(pk, provider);
      const abi = [
        "function bindPlatform(bytes32,string,string) external",
        "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      ];
      const registry = new ethers.Contract(registryAddress, abi, wallet);
      // Ensure caller is creator
      const entry = await registry.entries(contentHash);
      if (
        (entry?.creator || "").toLowerCase() !==
        (await wallet.getAddress()).toLowerCase()
      ) {
        return res
          .status(403)
          .json({ error: "Only creator can bind platform" });
      }
      const tx = await registry.bindPlatform(contentHash, platform, platformId);
      const receipt = await tx.wait();
      // upsert binding in DB
      try {
        const content = await prisma.content.findUnique({
          where: { contentHash },
        });
        await prisma.platformBinding.upsert({
          where: { platform_platformId: { platform, platformId } },
          create: { platform, platformId, contentId: content?.id },
          update: { contentId: content?.id },
        });
      } catch (e) {
        console.warn("DB upsert platform binding failed:", e);
      }
      res.json({ txHash: receipt?.hash });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

// Bind multiple platforms in one request (sequential txs)
app.post(
  "/api/bind-many",
  requireApiKey as any,
  async (req: Request, res: Response) => {
    try {
      const { registryAddress, contentHash } = req.body as any;
      let { bindings } = req.body as { bindings?: any };
      if (typeof bindings === "string") {
        try {
          bindings = JSON.parse(bindings);
        } catch {
          return res
            .status(400)
            .json({ error: "bindings must be a JSON array or object" });
        }
      }
      if (!registryAddress || !contentHash || !Array.isArray(bindings)) {
        return res.status(400).json({
          error: "registryAddress, contentHash, and bindings[] are required",
        });
      }
      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );
      const pk = process.env.PRIVATE_KEY;
      if (!pk)
        return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
      const wallet = new ethers.Wallet(pk, provider);
      const abi = [
        "function bindPlatform(bytes32,string,string) external",
        "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      ];
      const registry = new ethers.Contract(registryAddress, abi, wallet);
      // Ensure caller is creator
      const entry = await registry.entries(contentHash);
      if (
        (entry?.creator || "").toLowerCase() !==
        (await wallet.getAddress()).toLowerCase()
      ) {
        return res
          .status(403)
          .json({ error: "Only creator can bind platform" });
      }
      const results: Array<{
        platform: string;
        platformId: string;
        txHash?: string;
        error?: string;
      }> = [];
      for (const b of bindings) {
        const platform = (b?.platform || "").toString();
        const platformId = (b?.platformId || "").toString();
        if (!platform || !platformId) {
          results.push({ platform, platformId, error: "invalid binding" });
          continue;
        }
        try {
          const tx = await registry.bindPlatform(
            contentHash,
            platform,
            platformId
          );
          const rec = await tx.wait();
          results.push({ platform, platformId, txHash: rec?.hash });
          // upsert DB binding
          try {
            const content = await prisma.content.findUnique({
              where: { contentHash },
            });
            await prisma.platformBinding.upsert({
              where: { platform_platformId: { platform, platformId } },
              create: { platform, platformId, contentId: content?.id },
              update: { contentId: content?.id },
            });
          } catch (e) {
            console.warn("DB upsert platform binding (bind-many) failed:", e);
          }
        } catch (e: any) {
          results.push({
            platform,
            platformId,
            error: e?.message || String(e),
          });
        }
      }
      res.json({ results });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

// One-shot: upload content -> create+upload manifest -> register on-chain
app.post(
  "/api/one-shot",
  requireApiKey as any,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { registryAddress, platform, platformId, uploadContent } =
        req.body as {
          registryAddress?: string;
          platform?: string;
          platformId?: string;
          uploadContent?: string;
        };
      // Optional array bindings support via JSON field 'bindings'
      let bindings: Array<{ platform: string; platformId: string }> = [];
      const raw = (req.body as any).bindings;
      if (raw) {
        try {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (Array.isArray(parsed)) {
            bindings = parsed
              .filter((b) => b && b.platform && b.platformId)
              .map((b) => ({
                platform: String(b.platform),
                platformId: String(b.platformId),
              }));
          }
        } catch (e) {
          // ignore bad JSON here; fallback to single platform below
        }
      }
      if (!registryAddress)
        return res.status(400).json({ error: "registryAddress is required" });
      if (!req.file)
        return res
          .status(400)
          .json({ error: "file is required (multipart field 'file')" });

      // 1) Optionally upload content to IPFS (default: do NOT upload)
      const shouldUploadContent =
        String(uploadContent).toLowerCase() === "true";
      let contentCid: string | undefined;
      let contentUri: string | undefined;
      if (shouldUploadContent) {
        try {
          // File already on disk at req.file.path
          contentCid = await uploadToIpfs(req.file.path);
          contentUri = `ipfs://${contentCid}`;
        } catch (e) {
          // Clean up temp file before re-throwing
          await unlink(req.file.path).catch(() => {});
          throw e;
        }
      }

      // 2) Compute hash and create manifest
      const fileHash = await sha256HexFromFile(req.file.path);
      // Clean up the uploaded file now that we have the hash
      await unlink(req.file.path).catch(() => {});
      
      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );
      const net = await provider.getNetwork();
      const pk = process.env.PRIVATE_KEY;
      if (!pk)
        return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
      const wallet = new ethers.Wallet(pk);
      const signature = await wallet.signMessage(ethers.getBytes(fileHash));
      const manifest: any = {
        version: "1.0",
        algorithm: "sha256",
        content_hash: fileHash,
        creator_did: `did:pkh:eip155:${Number(net.chainId)}:${wallet.address}`,
        created_at: new Date().toISOString(),
        signature,
        attestations: [] as any[],
      };
      if (contentUri) manifest.content_uri = contentUri;

      // 3) Upload manifest to IPFS
      const tmpManifest = await tmpWrite(
        "manifest.json",
        Buffer.from(JSON.stringify(manifest))
      );
      let manifestCid: string | undefined;
      try {
        manifestCid = await uploadToIpfs(tmpManifest);
      } finally {
        await unlink(tmpManifest).catch(() => {});
      }
      const manifestURI = `ipfs://${manifestCid}`;

      // 4) Register on-chain
      const walletWithProvider = new ethers.Wallet(pk, provider);
      const abi = [
        "function register(bytes32 contentHash, string manifestURI) external",
      ];
      const registry = new ethers.Contract(
        registryAddress,
        abi,
        walletWithProvider
      );
      const tx = await registry.register(fileHash, manifestURI);
      const receipt = await tx.wait();

      // Optional: bind platforms (supports single legacy fields, or array)
      const bindAbi = ["function bindPlatform(bytes32,string,string) external"];
      const reg2 = new ethers.Contract(
        registryAddress,
        bindAbi,
        walletWithProvider
      );
      const bindTxHashes: string[] = [];
      const bindingsToProcess =
        bindings.length > 0
          ? bindings
          : platform && platformId
          ? [{ platform, platformId }]
          : [];
      for (const b of bindingsToProcess) {
        try {
          const btx = await reg2.bindPlatform(
            fileHash,
            b.platform,
            b.platformId
          );
          const brec = await btx.wait();
          if (brec?.hash) bindTxHashes.push(brec.hash);
          // upsert DB binding
          try {
            const content = await prisma.content.findUnique({
              where: { contentHash: fileHash },
            });
            await prisma.platformBinding.upsert({
              where: {
                platform_platformId: {
                  platform: b.platform,
                  platformId: b.platformId,
                },
              },
              create: {
                platform: b.platform,
                platformId: b.platformId,
                contentId: content?.id,
              },
              update: { contentId: content?.id },
            });
          } catch (e) {
            console.warn("DB upsert platform binding (one-shot) failed:", e);
          }
        } catch (e) {
          console.warn("Bind platform in one-shot failed:", e);
        }
      }

      // 5) Persist DB (best-effort)
      try {
        // upsert user
        const address = (await walletWithProvider.getAddress()).toLowerCase();
        const user = await prisma.user.upsert({
          where: { address },
          create: { address },
          update: {},
        });
        // upsert content
        await prisma.content.upsert({
          where: { contentHash: fileHash },
          create: {
            contentHash: fileHash,
            contentUri,
            manifestCid,
            manifestUri: manifestURI,
            creatorAddress: address,
            creatorId: user.id,
            registryAddress,
            txHash: receipt?.hash || undefined,
          },
          update: {
            contentUri,
            manifestCid,
            manifestUri: manifestURI,
            registryAddress,
            txHash: receipt?.hash || undefined,
          },
        });
      } catch (e) {
        console.warn("DB upsert content (one-shot) failed:", e);
      }

      res.json({
        contentCid,
        contentUri,
        contentHash: fileHash,
        manifestCid,
        manifestURI,
        txHash: receipt?.hash,
        bindTxHash: bindTxHashes[0],
        bindTxHashes,
        chainId: Number(net.chainId),
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
