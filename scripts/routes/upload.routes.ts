import { Router, Request, Response } from "express";
import multer from "multer";
import { requireApiKey } from "../middleware/auth.middleware";
import { tmpWrite, cleanupTmpFile } from "../services/file.service";
import { uploadToIpfs } from "../upload-ipfs";
import { validateFile } from "../validation/middleware";
import { ALLOWED_MIME_TYPES } from "../validation/schemas";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
}); // up to 1GB

// Upload to IPFS
router.post(
  "/upload",
  requireApiKey as any,
  upload.single("file"),
  validateFile({ required: true, allowedMimeTypes: ALLOWED_MIME_TYPES }),
  async (req: Request, res: Response) => {
    try {
      const tmpPath = await tmpWrite(req.file!.originalname, req.file!.buffer);
      try {
        const cid = await uploadToIpfs(tmpPath);
        res.json({ cid, uri: `ipfs://${cid}` });
      } finally {
        await cleanupTmpFile(tmpPath);
      }
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
