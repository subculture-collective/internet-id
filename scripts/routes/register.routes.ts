import { Router, Request, Response } from "express";
import multer from "multer";
import { ethers } from "ethers";
import { requireApiKey } from "../middleware/auth.middleware";
import { sha256Hex } from "../services/hash.service";
import { validateBody, validateFile } from "../validation/middleware";
import { registerRequestSchema, ALLOWED_MIME_TYPES } from "../validation/schemas";
import { createProviderAndWallet, createRegistryContract } from "../services/blockchain.service";
import { REGISTER_ABI } from "../constants/abi";
import { upsertUser, upsertContent } from "../services/content-db.service";
import { sendErrorResponse } from "../utils/error-response.util";

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

      const { provider, wallet } = createProviderAndWallet();
      const registry = createRegistryContract(registryAddress, REGISTER_ABI, wallet);
      const tx = await registry.register(fileHash, manifestURI);
      const receipt = await tx.wait();
      
      // upsert user by creatorAddress
      const address = (await wallet.getAddress()).toLowerCase();
      const creatorId = await upsertUser(address);
      
      // persist content record in DB
      await upsertContent({
        contentHash: fileHash!,
        contentUri: undefined,
        manifestUri: manifestURI,
        manifestCid: manifestURI.startsWith("ipfs://")
          ? manifestURI.replace("ipfs://", "")
          : undefined,
        creatorAddress: address,
        creatorId,
        registryAddress,
        txHash: receipt?.hash || undefined,
      });
      res.json({ txHash: receipt?.hash, contentHash: fileHash, manifestURI });
    } catch (e: any) {
      if (e?.message?.includes("PRIVATE_KEY missing")) {
        return sendErrorResponse(res, new Error("PRIVATE_KEY missing in env"), 400, {
          correlationId: (req as any).correlationId,
          operation: "register",
          path: req.path,
          method: req.method,
        });
      }
      sendErrorResponse(res, e, 500, {
        correlationId: (req as any).correlationId,
        operation: "register",
        path: req.path,
        method: req.method,
      });
    }
  }
);

export default router;
