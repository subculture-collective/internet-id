import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import { requireApiKey } from "../middleware/auth.middleware";
import { sha256HexFromFile } from "../services/hash.service";
import { upload, cleanupUpload } from "../middleware/upload.middleware";
import { tmpWrite, cleanupTmpFile } from "../services/file.service";
import { uploadToIpfs } from "../upload-ipfs";
import { prisma } from "../db";
import { validateBody, validateFile } from "../validation/middleware";
import { oneshotRequestSchema, ALLOWED_MIME_TYPES } from "../validation/schemas";

const router = Router();

// One-shot: upload content -> create+upload manifest -> register on-chain
router.post(
  "/one-shot",
  requireApiKey as any,
  upload.single("file"),
  validateBody(oneshotRequestSchema),
  validateFile({ required: true, allowedMimeTypes: ALLOWED_MIME_TYPES }),
  async (req: Request, res: Response) => {
    try {
      const {
        registryAddress,
        platform,
        platformId,
        uploadContent,
        bindings: rawBindings,
      } = req.body as {
        registryAddress: string;
        platform?: string;
        platformId?: string;
        uploadContent?: string;
        bindings?: string | Array<{ platform: string; platformId: string }>;
      };

      // Parse bindings if provided as string
      let bindings: Array<{ platform: string; platformId: string }> = [];
      if (rawBindings) {
        if (typeof rawBindings === "string") {
          try {
            const parsed = JSON.parse(rawBindings);
            if (Array.isArray(parsed)) {
              bindings = parsed
                .filter((b) => b && b.platform && b.platformId)
                .map((b) => ({
                  platform: String(b.platform),
                  platformId: String(b.platformId),
                }));
            }
          } catch (e) {
            // Validation middleware should have caught this, but handle gracefully
            bindings = [];
          }
        } else if (Array.isArray(rawBindings)) {
          bindings = rawBindings;
        }
      }

      // 1) Optionally upload content to IPFS (default: do NOT upload)
      const shouldUploadContent = String(uploadContent).toLowerCase() === "true";
      let contentCid: string | undefined;
      let contentUri: string | undefined;
      if (shouldUploadContent) {
        contentCid = await uploadToIpfs(req.file!.path);
        contentUri = `ipfs://${contentCid}`;
      }

      // 2) Compute hash and create manifest
      const fileHash = await sha256HexFromFile(req.file!.path);
      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );
      const net = await provider.getNetwork();
      const pk = process.env.PRIVATE_KEY;
      if (!pk) return res.status(500).json({ error: "Server configuration error" });
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
      const tmpManifest = await tmpWrite("manifest.json", Buffer.from(JSON.stringify(manifest)));
      let manifestCid: string | undefined;
      try {
        manifestCid = await uploadToIpfs(tmpManifest);
      } finally {
        await cleanupTmpFile(tmpManifest);
      }
      const manifestURI = `ipfs://${manifestCid}`;

      // 4) Register on-chain
      const walletWithProvider = new ethers.Wallet(pk, provider);
      const abi = ["function register(bytes32 contentHash, string manifestURI) external"];
      const registry = new ethers.Contract(registryAddress, abi, walletWithProvider);
      const tx = await registry.register(fileHash, manifestURI);
      const receipt = await tx.wait();

      // Optional: bind platforms (supports single legacy fields, or array)
      const bindAbi = ["function bindPlatform(bytes32,string,string) external"];
      const reg2 = new ethers.Contract(registryAddress, bindAbi, walletWithProvider);
      const bindTxHashes: string[] = [];
      const bindingsToProcess =
        bindings.length > 0 ? bindings : platform && platformId ? [{ platform, platformId }] : [];
      for (const b of bindingsToProcess) {
        try {
          const btx = await reg2.bindPlatform(fileHash, b.platform, b.platformId);
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
    } finally {
      await cleanupUpload(req);
    }
  }
);

export default router;
