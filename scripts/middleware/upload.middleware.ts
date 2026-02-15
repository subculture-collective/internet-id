import multer from "multer";
import * as os from "os";
import * as path from "path";
import { unlink } from "fs/promises";
import { Request } from "express";

/**
 * Shared multer configuration using disk storage.
 *
 * All file uploads are written to the OS temp directory to avoid
 * keeping large files (up to 1GB) in memory, which could cause OOM
 * under concurrent requests.
 *
 * Routes that need file contents should read from `req.file.path`.
 */
const diskStorage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${path.basename(file.originalname)}`;
    cb(null, uniqueName);
  },
});

/** Max upload size: 1 GB */
const MAX_FILE_SIZE = 1024 * 1024 * 1024;

export const upload = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * Clean up the uploaded temp file after the request is handled.
 * Call this in `finally` blocks or after processing.
 */
export async function cleanupUpload(req: Request): Promise<void> {
  if (req.file?.path) {
    await unlink(req.file.path).catch(() => {});
  }
}
