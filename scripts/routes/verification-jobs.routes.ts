import { Router, Request, Response } from "express";
import multer from "multer";
import { ethers } from "ethers";
import * as os from "os";
import * as path from "path";
import { unlink } from "fs/promises";
import { sha256HexFromFile } from "../services/hash.service";
import { fetchManifest } from "../services/manifest.service";
import { getProvider, getEntry } from "../services/registry.service";
import { prisma } from "../db";
import { validateBody, validateFile } from "../validation/middleware";
import { verifyRequestSchema, proofRequestSchema, ALLOWED_MIME_TYPES } from "../validation/schemas";
import { verificationQueueService } from "../services/verification-queue.service";
import { cacheService } from "../services/cache.service";
import { sendErrorResponse } from "../utils/error-response.util";
import { logger } from "../services/logger.service";
import { sentryService } from "../services/sentry.service";

const router = Router();

// Use disk storage to prevent memory exhaustion
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (_req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${path.basename(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 1024 },
}); // up to 1GB

/**
 * Async Verify - Enqueue verification job
 * POST /api/verification-jobs/verify
 */
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

      if (!req.file) {
        return res.status(400).json({ error: "file is required" });
      }

      // Check if queue is available
      if (!verificationQueueService.isAvailable()) {
        // Fallback to synchronous processing
        let fileHash: string;
        const tempPath = req.file.path;
        try {
          fileHash = await sha256HexFromFile(tempPath);
        } finally {
          await unlink(tempPath).catch(() => {});
        }

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
          await prisma.verification.create({
            data: {
              contentHash: fileHash,
              manifestUri: manifestURI,
              recoveredAddress: recovered.toLowerCase(),
              creatorOnchain: (entry?.creator || "").toLowerCase(),
              status,
            },
          });
          await cacheService.delete(`verifications:${fileHash}`);
        } catch (e) {
          // Non-critical - log DB failures but don't fail the request
          const error = e instanceof Error ? e : new Error(String(e));
          logger.error("DB insert verification failed", error, {
            operation: "verify-job-persist",
            table: "verification",
            contentHash: fileHash,
          });
          sentryService.captureException(error, {
            operation: "verify-job-persist",
            table: "verification",
            contentHash: fileHash,
          });
        }

        return res.json({ mode: "sync", result });
      }

      // Queue the verification job
      const { jobId } = await verificationQueueService.queueVerification({
        type: "verify",
        filePath: req.file.path,
        manifestUri: manifestURI,
        registryAddress,
        rpcUrl,
      });

      res.json({
        mode: "async",
        jobId,
        status: "queued",
        message: "Verification job queued successfully",
        pollUrl: `/api/verification-jobs/${jobId}`,
      });
    } catch (e: any) {
      // Clean up temp file on error
      if (req.file?.path) {
        await unlink(req.file.path).catch(() => {});
      }
      sendErrorResponse(res, e, 500, {
        correlationId: (req as any).correlationId,
        operation: "verify-job-async",
        path: req.path,
        method: req.method,
      });
    }
  }
);

/**
 * Async Proof - Enqueue proof generation job
 * POST /api/verification-jobs/proof
 */
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

      if (!req.file) {
        return res.status(400).json({ error: "file is required" });
      }

      const originalFilename = req.file.originalname;

      // Check if queue is available
      if (!verificationQueueService.isAvailable()) {
        // Fallback to synchronous processing
        const filePath = req.file.path;
        let fileHash;
        try {
          fileHash = await sha256HexFromFile(filePath);
        } finally {
          await unlink(filePath).catch(() => {});
        }

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
        } catch {
          // Silently ignore log fetch failures
        }

        const proof = {
          version: "1.0",
          generated_at: new Date().toISOString(),
          network: { chainId: Number(net.chainId) },
          registry: registryAddress,
          content: { file: originalFilename, hash: fileHash },
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

        try {
          await prisma.verification.create({
            data: {
              contentHash: fileHash,
              manifestUri: manifestURI,
              recoveredAddress: recovered.toLowerCase(),
              creatorOnchain: (entry?.creator || "").toLowerCase(),
              status: proof.verification.status,
            },
          });
          await cacheService.delete(`verifications:${fileHash}`);
        } catch (e) {
          // Non-critical - log DB failures but don't fail the request
          const error = e instanceof Error ? e : new Error(String(e));
          logger.error("DB insert verification (proof) failed", error, {
            operation: "proof-job-persist",
            table: "verification",
            contentHash: fileHash,
          });
          sentryService.captureException(error, {
            operation: "proof-job-persist",
            table: "verification",
            contentHash: fileHash,
          });
        }

        return res.json({ mode: "sync", result: proof });
      }

      // Queue the proof generation job
      const { jobId } = await verificationQueueService.queueVerification({
        type: "proof",
        filePath: req.file.path,
        manifestUri: manifestURI,
        registryAddress,
        rpcUrl,
        originalFilename,
      });

      res.json({
        mode: "async",
        jobId,
        status: "queued",
        message: "Proof generation job queued successfully",
        pollUrl: `/api/verification-jobs/${jobId}`,
      });
    } catch (e: any) {
      // Clean up temp file on error
      if (req.file?.path) {
        await unlink(req.file.path).catch(() => {});
      }
      sendErrorResponse(res, e, 500, {
        correlationId: (req as any).correlationId,
        operation: "proof-job-async",
        path: req.path,
        method: req.method,
      });
    }
  }
);

/**
 * List verification jobs
 * GET /api/verification-jobs
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, limit, offset } = req.query as {
      status?: string;
      limit?: string;
      offset?: string;
    };

    const jobs = await verificationQueueService.listJobs({
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    res.json({ jobs, count: jobs.length });
  } catch (e: any) {
    sendErrorResponse(res, e, 500, {
      correlationId: (req as any).correlationId,
      operation: "list-jobs",
      path: req.path,
      method: req.method,
    });
  }
});

/**
 * Get queue statistics
 * GET /api/verification-jobs/stats
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await verificationQueueService.getStats();
    res.json(stats);
  } catch (e: any) {
    sendErrorResponse(res, e, 500, {
      correlationId: (req as any).correlationId,
      operation: "queue-stats",
      path: req.path,
      method: req.method,
    });
  }
});

/**
 * Get job status
 * GET /api/verification-jobs/:jobId
 */
router.get("/:jobId", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await verificationQueueService.getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (e: any) {
    sendErrorResponse(res, e, 500, {
      correlationId: (req as any).correlationId,
      operation: "get-job-status",
      path: req.path,
      method: req.method,
    });
  }
});

export default router;
