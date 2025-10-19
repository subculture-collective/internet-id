import { Router, Request, Response } from "express";
import multer from "multer";
import { ethers } from "ethers";
import { requireApiKey } from "../middleware/auth.middleware";
import { sha256Hex } from "../services/hash.service";
import { tmpWrite, cleanupTmpFile } from "../services/file.service";
import { uploadToIpfs } from "../upload-ipfs";

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
          await cleanupTmpFile(tmpPath);
        }
      }
      res.json({ manifest });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
