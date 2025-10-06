import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { writeFile, unlink } from "fs/promises";
import * as os from "os";
import * as path from "path";
import { createHash } from "crypto";
import { ethers } from "ethers";
import * as https from "https";
import * as dotenv from "dotenv";
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
}); // up to 1GB

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
      const tmpPath = await tmpWrite(req.file.originalname, req.file.buffer);
      try {
        const cid = await uploadToIpfs(tmpPath);
        res.json({ cid, uri: `ipfs://${cid}` });
      } finally {
        await unlink(tmpPath).catch(() => {});
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
        fileHash = sha256Hex(req.file.buffer);
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
      if (req.file) fileHash = sha256Hex(req.file.buffer);
      else if ((req.body as any).contentHash)
        fileHash = (req.body as any).contentHash;
      else
        return res
          .status(400)
          .json({ error: "file (multipart) or contentHash is required" });

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
    });
    res.json(items);
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
      const fileHash = sha256Hex(req.file.buffer);
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
      const fileHash = sha256Hex(req.file.buffer);
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
        content: { file: req.file.originalname, hash: fileHash },
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

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
