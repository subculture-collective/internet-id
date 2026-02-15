import { Router, Request, Response } from "express";
import { requireApiKey } from "../middleware/auth.middleware";
import { upload, cleanupUpload } from "../middleware/upload.middleware";
import { uploadToIpfs } from "../upload-ipfs";
import { validateFile } from "../validation/middleware";
import { ALLOWED_MIME_TYPES } from "../validation/schemas";

const router = Router();

// Upload to IPFS
router.post(
  "/upload",
  requireApiKey as any,
  upload.single("file"),
  validateFile({ required: true, allowedMimeTypes: ALLOWED_MIME_TYPES }),
  async (req: Request, res: Response) => {
    try {
      const cid = await uploadToIpfs(req.file!.path);
      res.json({ cid, uri: `ipfs://${cid}` });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    } finally {
      await cleanupUpload(req);
    }
  }
);

export default router;
