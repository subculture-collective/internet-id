import { Router, Request, Response } from "express";
import multer from "multer";
import { ethers } from "ethers";
import { requireApiKey } from "../middleware/auth.middleware";
import { sha256Hex } from "../services/hash.service";
import { prisma } from "../db";
import { validateBody, validateFile } from "../validation/middleware";
import { registerRequestSchema, ALLOWED_MIME_TYPES } from "../validation/schemas";
import { cacheService } from "../services/cache.service";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
}); // up to 1GB

// Register on-chain
router.post(
  "/register",
  requireApiKey as any,
  upload.single("file"),
  validateBody(registerRequestSchema),
  validateFile({ required: false, allowedMimeTypes: ALLOWED_MIME_TYPES }),
  async (req: Request, res: Response) => {
    try {
      const { registryAddress, manifestURI, contentHash } = req.body as {
        registryAddress: string;
        manifestURI: string;
        contentHash?: string;
      };

      let fileHash: string | undefined;
      if (req.file) {
        fileHash = sha256Hex(req.file.buffer);
      } else if (contentHash) {
        fileHash = contentHash;
      } else {
        return res.status(400).json({
          error: "Validation failed",
          errors: [
            {
              field: "file",
              message: "file (multipart) or contentHash is required",
            },
          ],
        });
      }

      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );
      const pk = process.env.PRIVATE_KEY;
      if (!pk) return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
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
        
        // Invalidate content cache after registration
        await cacheService.delete(`content:${fileHash}`);
      } catch (e) {
        console.warn("DB upsert content failed:", e);
      }
      res.json({ txHash: receipt?.hash, contentHash: fileHash, manifestURI });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
