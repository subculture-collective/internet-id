/**
 * Verification Queue Service
 * Handles async verification job processing using BullMQ and Redis
 */

import { Queue, Worker, Job, QueueEvents } from "bullmq";
import { Redis } from "ioredis";
import { ethers } from "ethers";
import { createReadStream, createHash } from "fs";
import { pipeline } from "stream/promises";
import { logger } from "./logger.service";
import { fetchManifest } from "./manifest.service";
import { getProvider, getEntry } from "./registry.service";
import { PrismaClient } from "@prisma/client";
import { getStartBlock } from "../utils/block-range.util";

const prisma = new PrismaClient();

// Job data types
interface VerifyJobData {
  type: "verify" | "proof";
  filePath?: string; // Temp file path for uploaded file
  contentHash?: string; // Pre-computed hash if no file
  manifestUri: string;
  registryAddress: string;
  rpcUrl?: string;
  originalFilename?: string; // For proof generation
}

// Queue configuration
const QUEUE_NAME = "verification";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF = {
  type: "exponential" as const,
  delay: 5000, // Start with 5 seconds
};

class VerificationQueueService {
  private queue?: Queue<VerifyJobData>;
  private worker?: Worker<VerifyJobData>;
  private queueEvents?: QueueEvents;
  private connection?: Redis;
  private isInitialized = false;

  /**
   * Initialize the verification queue
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.info(
        "Verification queue disabled (REDIS_URL not set). Verifications will be processed synchronously."
      );
      this.isInitialized = true;
      return;
    }

    try {
      // Create Redis connection
      this.connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
      });

      // Create queue
      this.queue = new Queue<VerifyJobData>(QUEUE_NAME, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: MAX_RETRY_ATTEMPTS,
          backoff: RETRY_BACKOFF,
          removeOnComplete: {
            age: 3600 * 24 * 7, // Keep completed jobs for 7 days
            count: 1000,
          },
          removeOnFail: {
            age: 3600 * 24 * 30, // Keep failed jobs for 30 days
          },
        },
      });

      // Create worker to process jobs
      this.worker = new Worker<VerifyJobData>(
        QUEUE_NAME,
        async (job: Job<VerifyJobData>) => {
          return await this.processVerificationJob(job);
        },
        {
          connection: this.connection,
          concurrency: 3, // Process up to 3 verifications concurrently
        }
      );

      // Create queue events listener
      this.queueEvents = new QueueEvents(QUEUE_NAME, {
        connection: this.connection,
      });

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      logger.info("Verification queue service initialized with Redis");
    } catch (error) {
      logger.error("Failed to initialize verification queue:", error);
      throw error;
    }
  }

  /**
   * Set up event listeners for queue monitoring
   */
  private setupEventListeners(): void {
    if (!this.worker || !this.queueEvents) return;

    this.worker.on("completed", (job) => {
      logger.info("Verification job completed", {
        jobId: job.id,
        attempts: job.attemptsMade,
      });
    });

    this.worker.on("failed", (job, error) => {
      logger.error("Verification job failed", {
        jobId: job?.id,
        attempts: job?.attemptsMade,
        error: error.message,
      });
    });

    this.queueEvents.on("stalled", ({ jobId }) => {
      logger.warn("Verification job stalled", { jobId });
    });

    this.worker.on("progress", (job, progress) => {
      logger.debug("Verification job progress", {
        jobId: job.id,
        progress,
      });
    });
  }

  /**
   * Compute SHA256 hash from file
   */
  private async sha256HexFromFile(filePath: string): Promise<string> {
    const hash = createHash("sha256");
    await pipeline(createReadStream(filePath), hash);
    return "0x" + hash.digest("hex");
  }

  /**
   * Process a verification job
   */
  private async processVerificationJob(
    job: Job<VerifyJobData>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const data = job.data;

    // Create or update job record in database
    let dbJob = await prisma.verificationJob.findUnique({
      where: { jobId: job.id || "" },
    });

    if (!dbJob) {
      dbJob = await prisma.verificationJob.create({
        data: {
          jobId: job.id || "",
          type: data.type,
          manifestUri: data.manifestUri,
          registryAddress: data.registryAddress,
          rpcUrl: data.rpcUrl || undefined,
          status: "processing",
          retryCount: job.attemptsMade,
        },
      });
    } else {
      await prisma.verificationJob.update({
        where: { id: dbJob.id },
        data: {
          status: "processing",
          startedAt: new Date(),
          retryCount: job.attemptsMade,
        },
      });
    }

    try {
      // Step 1: Compute file hash if needed
      await job.updateProgress(10);
      let fileHash: string;
      if (data.contentHash) {
        fileHash = data.contentHash;
      } else if (data.filePath) {
        fileHash = await this.sha256HexFromFile(data.filePath);
      } else {
        throw new Error("Either contentHash or filePath must be provided");
      }

      // Update database with content hash
      await prisma.verificationJob.update({
        where: { id: dbJob.id },
        data: { contentHash: fileHash, progress: 10 },
      });

      // Step 2: Fetch manifest
      await job.updateProgress(30);
      const manifest = await fetchManifest(data.manifestUri);

      // Step 3: Verify signature
      await job.updateProgress(50);
      const manifestHashOk = manifest.content_hash === fileHash;
      const recovered = ethers.verifyMessage(
        ethers.getBytes(manifest.content_hash),
        manifest.signature
      );

      // Step 4: Check on-chain registry
      await job.updateProgress(70);
      const provider = getProvider(data.rpcUrl);
      const entry = await getEntry(data.registryAddress, fileHash, provider);

      const creatorOk = (entry?.creator || "").toLowerCase() === recovered.toLowerCase();
      const manifestOk = entry?.manifestURI === data.manifestUri;

      const status =
        manifestHashOk && creatorOk && manifestOk
          ? "OK"
          : manifestHashOk && creatorOk
            ? "WARN"
            : "FAIL";

      let result: any;

      if (data.type === "verify") {
        // Simple verification result
        result = {
          status,
          fileHash,
          recovered,
          onchain: entry,
          checks: { manifestHashOk, creatorOk, manifestOk },
        };
      } else {
        // Proof generation (more detailed)
        await job.updateProgress(85);
        const net = await provider.getNetwork();
        const topic0 = ethers.id("ContentRegistered(bytes32,address,string,uint64)");
        let txHash: string | undefined;
        try {
          const startBlock = await getStartBlock(provider);
          
          const logs = await provider.getLogs({
            address: data.registryAddress,
            fromBlock: startBlock,
            toBlock: "latest",
            topics: [topic0, fileHash],
          });
          if (logs.length) txHash = logs[logs.length - 1].transactionHash;
        } catch {
          // Silently ignore log fetch failures
        }

        result = {
          version: "1.0",
          generated_at: new Date().toISOString(),
          network: { chainId: Number(net.chainId) },
          registry: data.registryAddress,
          content: { file: data.originalFilename || "unknown", hash: fileHash },
          manifest: {
            uri: data.manifestUri,
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
            fileHashMatchesManifest: manifestHashOk,
            creatorMatchesOnchain: creatorOk,
            manifestURIMatchesOnchain: manifestOk,
            status,
          },
        };
      }

      // Step 5: Persist verification record
      await job.updateProgress(90);
      try {
        await prisma.verification.create({
          data: {
            contentHash: fileHash,
            manifestUri: data.manifestUri,
            recoveredAddress: recovered.toLowerCase(),
            creatorOnchain: (entry?.creator || "").toLowerCase(),
            status,
          },
        });
      } catch (e) {
        logger.warn("DB insert verification failed:", e);
      }

      // Update job as completed
      await job.updateProgress(100);
      await prisma.verificationJob.update({
        where: { id: dbJob.id },
        data: {
          status: "completed",
          result: JSON.stringify(result),
          progress: 100,
          completedAt: new Date(),
        },
      });

      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Update job as failed
      await prisma.verificationJob.update({
        where: { id: dbJob.id },
        data: {
          status: "failed",
          error: errorMessage,
          retryCount: job.attemptsMade,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Queue a verification job
   */
  async queueVerification(data: VerifyJobData): Promise<{ jobId: string; queued: boolean }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // If queue is not available, return indicator for synchronous processing
    if (!this.queue) {
      logger.debug("Verification queue not available - will process synchronously");
      return { jobId: "", queued: false };
    }

    // Queue the verification
    const job = await this.queue.add("verify", data, {
      priority: data.type === "verify" ? 5 : 10, // Proofs have lower priority
    });

    // Create initial database record
    await prisma.verificationJob.create({
      data: {
        jobId: job.id || "",
        type: data.type,
        manifestUri: data.manifestUri,
        registryAddress: data.registryAddress,
        rpcUrl: data.rpcUrl || undefined,
        status: "queued",
      },
    });

    logger.debug("Verification queued", {
      jobId: job.id,
      type: data.type,
      manifestUri: data.manifestUri,
    });

    return { jobId: job.id || "", queued: true };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    // Check database first
    const dbJob = await prisma.verificationJob.findUnique({
      where: { jobId },
    });

    if (!dbJob) {
      return null;
    }

    // If queue is available, get additional info from BullMQ
    if (this.queue) {
      try {
        const job = await this.queue.getJob(jobId);
        if (job) {
          const state = await job.getState();
          return {
            ...dbJob,
            state,
            progress: await job.progress,
            result: dbJob.result ? JSON.parse(dbJob.result) : null,
          };
        }
      } catch (e) {
        logger.warn("Failed to get job from queue:", e);
      }
    }

    return {
      ...dbJob,
      result: dbJob.result ? JSON.parse(dbJob.result) : null,
    };
  }

  /**
   * List jobs with optional filters
   */
  async listJobs(options?: { status?: string; limit?: number; offset?: number }): Promise<any[]> {
    const jobs = await prisma.verificationJob.findMany({
      where: options?.status ? { status: options.status } : undefined,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return jobs.map((job) => ({
      ...job,
      result: job.result ? JSON.parse(job.result) : null,
    }));
  }

  /**
   * Get queue stats
   */
  async getStats() {
    if (!this.queue) {
      return {
        available: false,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      };
    }

    const counts = await this.queue.getJobCounts();
    return {
      available: true,
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
    };
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queueEvents) {
      await this.queueEvents.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
    if (this.connection) {
      await this.connection.quit();
    }
    this.isInitialized = false;
  }

  /**
   * Check if queue is available
   */
  isAvailable(): boolean {
    return this.queue !== undefined;
  }
}

// Export singleton instance
export const verificationQueueService = new VerificationQueueService();

// Export types
export type { VerifyJobData };
