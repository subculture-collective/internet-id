import { Router, Request, Response } from "express";
import multer from "multer";
import { ethers } from "ethers";
import { requireApiKey } from "../middleware/auth.middleware";
import { sha256Hex } from "../services/hash.service";
import { tmpWrite, cleanupTmpFile } from "../services/file.service";
import { uploadToIpfs } from "../upload-ipfs";
import { validateBody, validateFile } from "../validation/middleware";
import { manifestRequestSchema, ALLOWED_MIME_TYPES } from "../validation/schemas";
import { createProviderAndWallet } from "../services/blockchain.service";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
}); // up to 1GB

// Create manifest (optionally upload it)
router.post(
  "/manifest",
  requireApiKey as any,
  upload.single("file"),
  validateBody(manifestRequestSchema),
  validateFile({ required: false, allowedMimeTypes: ALLOWED_MIME_TYPES }),
  async (req: Request, res: Response) => {
    try {
      const {
        contentUri,
        upload: doUpload,
        contentHash,
      } = req.body as {
        contentUri: string;
        upload?: string;
        contentHash?: string;
      };

      let fileHash: string | undefined = undefined;
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

      try {
        const { provider, wallet } = createProviderAndWallet();
        const net = await provider.getNetwork();
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
          const tmpPath = await tmpWrite("manifest.json", Buffer.from(JSON.stringify(manifest)));
          try {
            const cid = await uploadToIpfs(tmpPath);
            return res.json({ manifest, cid, uri: `ipfs://${cid}` });
          } finally {
            await cleanupTmpFile(tmpPath);
          }
        }
        res.json({ manifest });
      } catch (e: any) {
        if (e?.message?.includes("PRIVATE_KEY missing")) {
          return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
        }
        res.status(500).json({ error: e?.message || String(e) });
      }
  }
);

export default router;
