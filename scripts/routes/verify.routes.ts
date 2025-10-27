import { Router, Request, Response } from "express";
import multer from "multer";
import { ethers } from "ethers";
import { sha256Hex } from "../services/hash.service";
import { fetchManifest } from "../services/manifest.service";
import { getProvider, getEntry } from "../services/registry.service";
import { prisma } from "../db";
import { validateBody, validateFile } from "../validation/middleware";
import { verifyRequestSchema, proofRequestSchema, ALLOWED_MIME_TYPES } from "../validation/schemas";
import { cacheService } from "../services/cache.service";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
}); // up to 1GB

// Verify
router.post(
  "/verify",
  upload.single("file"),
  validateBody(verifyRequestSchema),
  validateFile({ required: true, allowedMimeTypes: ALLOWED_MIME_TYPES }),
  async (req: Request, res: Response) => {
    try {
      const { registryAddress, manifestURI, rpcUrl } = req.body as {
        registryAddress: string;
        manifestURI: string;
        rpcUrl?: string;
      };

      const fileHash = sha256Hex(req.file!.buffer);
      const manifest = await fetchManifest(manifestURI);
      const manifestHashOk = manifest.content_hash === fileHash;
      const recovered = ethers.verifyMessage(
        ethers.getBytes(manifest.content_hash),
        manifest.signature
      );
      const provider = getProvider(rpcUrl);
      const entry = await getEntry(registryAddress, fileHash, provider);
      const creatorOk = (entry?.creator || "").toLowerCase() === recovered.toLowerCase();
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

        // Invalidate verification cache after new verification
        await cacheService.delete(`verifications:${fileHash}`);
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
router.post(
  "/proof",
  upload.single("file"),
  validateBody(proofRequestSchema),
  validateFile({ required: true, allowedMimeTypes: ALLOWED_MIME_TYPES }),
  async (req: Request, res: Response) => {
    try {
      const { registryAddress, manifestURI, rpcUrl } = req.body as {
        registryAddress: string;
        manifestURI: string;
        rpcUrl?: string;
      };

      const fileHash = sha256Hex(req.file!.buffer);
      const manifest = await fetchManifest(manifestURI);
      const recovered = ethers.verifyMessage(
        ethers.getBytes(manifest.content_hash),
        manifest.signature
      );
      const provider = getProvider(rpcUrl);
      const net = await provider.getNetwork();
      const entry = await getEntry(registryAddress, fileHash, provider);
      const creatorOk = (entry?.creator || "").toLowerCase() === recovered.toLowerCase();
      const manifestOk = entry?.manifestURI === manifestURI;
      const topic0 = ethers.id("ContentRegistered(bytes32,address,string,uint64)");
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
        content: { file: req.file!.originalname, hash: fileHash },
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

        // Invalidate verification cache after new verification
        await cacheService.delete(`verifications:${fileHash}`);
      } catch (e) {
        console.warn("DB insert verification (proof) failed:", e);
      }
      res.json(proof);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
