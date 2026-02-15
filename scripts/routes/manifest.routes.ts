import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import { requireApiKey } from "../middleware/auth.middleware";
import { sha256HexFromFile } from "../services/hash.service";
import { upload, cleanupUpload } from "../middleware/upload.middleware";
import { tmpWrite, cleanupTmpFile } from "../services/file.service";
import { uploadToIpfs } from "../upload-ipfs";
import { validateBody, validateFile } from "../validation/middleware";
import { manifestRequestSchema, ALLOWED_MIME_TYPES } from "../validation/schemas";

const router = Router();

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
        fileHash = await sha256HexFromFile(req.file.path);
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
      const net = await provider.getNetwork();
      const pk = process.env.PRIVATE_KEY;
      if (!pk) return res.status(500).json({ error: "Server configuration error" });
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
      res.status(500).json({ error: e?.message || String(e) });
    } finally {
      await cleanupUpload(req);
    }
  }
);

export default router;
