import { Router, Request, Response } from "express";
import multer from "multer";
import { ethers } from "ethers";
import { requireApiKey } from "../middleware/auth.middleware";
import { sha256Hex } from "../services/hash.service";
import { tmpWrite, cleanupTmpFile } from "../services/file.service";
import { uploadToIpfs } from "../upload-ipfs";
import { validateBody, validateFile } from "../validation/middleware";
import { oneshotRequestSchema, ALLOWED_MIME_TYPES } from "../validation/schemas";
import { createProviderAndWallet, createRegistryContract } from "../services/blockchain.service";
import { REGISTER_ABI, BIND_PLATFORM_ABI } from "../constants/abi";
import { upsertUser, upsertContent, upsertPlatformBinding } from "../services/content-db.service";

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
        const tmpContent = await tmpWrite(req.file!.originalname, req.file!.buffer);
        try {
          contentCid = await uploadToIpfs(tmpContent);
          contentUri = `ipfs://${contentCid}`;
        } finally {
          await cleanupTmpFile(tmpContent);
        }
      }

      // 2) Compute hash and create manifest
      const fileHash = sha256Hex(req.file!.buffer);
      
      const { provider, wallet } = createProviderAndWallet();
      const net = await provider.getNetwork();
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
      const registry = createRegistryContract(registryAddress, REGISTER_ABI, wallet);
      const tx = await registry.register(fileHash, manifestURI);
      const receipt = await tx.wait();

      // Optional: bind platforms (supports single legacy fields, or array)
      const reg2 = createRegistryContract(registryAddress, BIND_PLATFORM_ABI, wallet);
      const bindTxHashes: string[] = [];
      const bindingsToProcess =
        bindings.length > 0 ? bindings : platform && platformId ? [{ platform, platformId }] : [];
      for (const b of bindingsToProcess) {
        try {
          const btx = await reg2.bindPlatform(fileHash, b.platform, b.platformId);
          const brec = await btx.wait();
          if (brec?.hash) bindTxHashes.push(brec.hash);
          
          // upsert DB binding
          await upsertPlatformBinding({
            platform: b.platform,
            platformId: b.platformId,
            contentHash: fileHash,
          });
        } catch (e) {
          console.warn("Bind platform in one-shot failed:", e);
        }
      }

      // 5) Persist DB (best-effort)
      const address = (await wallet.getAddress()).toLowerCase();
      const creatorId = await upsertUser(address);
      await upsertContent({
        contentHash: fileHash,
        contentUri,
        manifestUri: manifestURI,
        manifestCid,
        creatorAddress: address,
        creatorId,
        registryAddress,
        txHash: receipt?.hash || undefined,
      });

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
      if (e?.message?.includes("PRIVATE_KEY missing")) {
        return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
      }
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
