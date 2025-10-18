import { Router, Request, Response } from "express";
import multer from "multer";
import { ethers } from "ethers";
import { requireApiKey } from "../middleware/auth.middleware";
import { sha256Hex } from "../services/hash.service";
import { tmpWrite, cleanupTmpFile } from "../services/file.service";
import { uploadToIpfs } from "../upload-ipfs";
import { prisma } from "../db";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
}); // up to 1GB

// One-shot: upload content -> create+upload manifest -> register on-chain
router.post(
  "/one-shot",
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
        const tmpContent = await tmpWrite(
          req.file.originalname,
          req.file.buffer
        );
        try {
          contentCid = await uploadToIpfs(tmpContent);
          contentUri = `ipfs://${contentCid}`;
        } finally {
          await cleanupTmpFile(tmpContent);
        }
      }

      // 2) Compute hash and create manifest
      const fileHash = sha256Hex(req.file.buffer);
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
        await cleanupTmpFile(tmpManifest);
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

export default router;
