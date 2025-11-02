/**
 * Manual test script for verification queue
 * Demonstrates async verification processing with BullMQ
 */

import { verificationQueueService } from "./services/verification-queue.service";
import { prisma } from "./db";
import { writeFile } from "fs/promises";
import * as path from "path";
import * as os from "os";

async function main() {
  console.log("🔍 Testing Verification Queue Service\n");

  // Initialize the queue
  console.log("1️⃣  Initializing verification queue...");
  await verificationQueueService.initialize();
  console.log(`   ✓ Queue available: ${verificationQueueService.isAvailable()}\n`);

  if (!verificationQueueService.isAvailable()) {
    console.log("⚠️  Redis not available. Queue will use synchronous fallback.");
    console.log("   To enable queue:");
    console.log("   1. Start Redis: docker run -d -p 6379:6379 redis:7-alpine");
    console.log("   2. Set REDIS_URL=redis://localhost:6379");
    process.exit(0);
  }

  // Check initial stats
  console.log("2️⃣  Checking queue statistics...");
  const initialStats = await verificationQueueService.getStats();
  console.log("   Initial stats:", initialStats);
  console.log();

  // Create a test file
  console.log("3️⃣  Creating test file...");
  const testContent = Buffer.from("This is a test file for verification queue");
  const tempPath = path.join(os.tmpdir(), `test-queue-${Date.now()}.txt`);
  await writeFile(tempPath, testContent);
  console.log(`   ✓ Test file created: ${tempPath}\n`);

  // Enqueue a test verification job
  console.log("4️⃣  Enqueuing test verification job...");
  const { jobId } = await verificationQueueService.queueVerification({
    type: "verify",
    filePath: tempPath,
    manifestUri: "ipfs://test-manifest-uri",
    registryAddress: "0x1234567890123456789012345678901234567890",
    rpcUrl: process.env.RPC_URL || "https://sepolia.base.org",
  });

  console.log(`   ✓ Job queued with ID: ${jobId}\n`);

  // Poll for job status
  console.log("5️⃣  Polling job status...");
  let attempts = 0;
  const maxAttempts = 30;
  let completed = false;

  while (!completed && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const status = await verificationQueueService.getJobStatus(jobId);
    console.log(
      `   Attempt ${attempts + 1}/${maxAttempts}: Status = ${status?.status}, Progress = ${status?.progress}%`
    );

    if (status?.status === "completed") {
      completed = true;
      console.log("\n   ✅ Job completed successfully!");
      console.log("   Result:", JSON.stringify(status.result, null, 2));
    } else if (status?.status === "failed") {
      console.log("\n   ❌ Job failed!");
      console.log("   Error:", status.error);
      break;
    }

    attempts++;
  }

  if (!completed && attempts >= maxAttempts) {
    console.log("\n   ⏱️  Job still processing after timeout");
  }

  // Check final stats
  console.log("\n6️⃣  Final queue statistics...");
  const finalStats = await verificationQueueService.getStats();
  console.log("   Final stats:", finalStats);

  // List recent jobs
  console.log("\n7️⃣  Recent jobs:");
  const jobs = await verificationQueueService.listJobs({ limit: 5 });
  jobs.forEach((job: any, index: number) => {
    console.log(
      `   ${index + 1}. Job ${job.jobId}: ${job.type} - ${job.status} (${job.progress}%)`
    );
  });

  // Cleanup
  console.log("\n8️⃣  Cleaning up...");
  await verificationQueueService.close();
  await prisma.$disconnect();

  console.log("\n✅ Test completed successfully!");
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
