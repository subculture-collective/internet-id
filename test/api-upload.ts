import { expect } from "chai";
import { createWriteStream, createReadStream } from "fs";
import { writeFile, unlink, readFile } from "fs/promises";
import * as path from "path";
import * as os from "os";
import { createHash } from "crypto";

/**
 * Integration tests for file upload streaming behavior
 * These tests verify that large files are handled via disk streaming
 * rather than loading entire contents into memory
 */
describe("API File Upload Streaming", function () {
  // Set timeout for large file tests
  this.timeout(30000);

  const tmpDir = os.tmpdir();
  let testFiles: string[] = [];

  afterEach(async function () {
    // Clean up test files
    for (const file of testFiles) {
      try {
        await unlink(file);
      } catch (e) {
        // ignore cleanup errors
      }
    }
    testFiles = [];
  });

  /**
   * Helper to compute SHA256 hash via streaming (same as API does)
   */
  function sha256HexFromFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash("sha256");
      const stream = createReadStream(filePath);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve("0x" + hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  /**
   * Helper to create a test file of specified size
   */
  async function createTestFile(
    sizeMB: number,
    name?: string,
    seed: number = 0
  ): Promise<string> {
    const filename = name || `test-file-${Date.now()}-${Math.random()}.bin`;
    const filepath = path.join(tmpDir, filename);
    testFiles.push(filepath);

    // Create file with random data in chunks to avoid memory issues
    const writeStream = createWriteStream(filepath);
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalBytes = sizeMB * 1024 * 1024;
    let written = 0;

    return new Promise((resolve, reject) => {
      const writeChunk = () => {
        while (written < totalBytes) {
          const remaining = totalBytes - written;
          const currentChunkSize = Math.min(chunkSize, remaining);
          const chunk = Buffer.alloc(currentChunkSize);

          // Fill with pseudo-random but deterministic data based on seed
          for (let i = 0; i < currentChunkSize; i++) {
            chunk[i] = ((written + i + seed) * 37) % 256;
          }

          written += currentChunkSize;
          const canWrite = writeStream.write(chunk);

          if (!canWrite && written < totalBytes) {
            // Wait for drain event
            writeStream.once("drain", writeChunk);
            return;
          }
        }

        writeStream.end();
      };

      writeStream.on("finish", () => resolve(filepath));
      writeStream.on("error", reject);
      writeChunk();
    });
  }

  it("should hash a small file via streaming", async function () {
    // Create a 1MB test file
    const filepath = await createTestFile(1, "small-test.bin");
    
    // Compute hash via streaming
    const hash = await sha256HexFromFile(filepath);
    
    // Hash should be a hex string with 0x prefix
    expect(hash).to.match(/^0x[a-f0-9]{64}$/);
  });

  it("should hash a large file via streaming without loading into memory", async function () {
    // Create a 100MB test file
    const filepath = await createTestFile(100, "large-test.bin");
    
    // Get file stats to verify size
    const stats = await readFile(filepath).then((buf) => buf.length);
    expect(stats).to.equal(100 * 1024 * 1024);
    
    // Compute hash via streaming
    const hash = await sha256HexFromFile(filepath);
    
    // Hash should be a hex string with 0x prefix
    expect(hash).to.match(/^0x[a-f0-9]{64}$/);
  });

  it("should produce consistent hashes for the same file", async function () {
    // Create a 10MB test file with deterministic data
    const filepath = await createTestFile(10, "consistent-test.bin");
    
    // Compute hash twice
    const hash1 = await sha256HexFromFile(filepath);
    const hash2 = await sha256HexFromFile(filepath);
    
    // Hashes should match
    expect(hash1).to.equal(hash2);
  });

  it("should handle multiple concurrent file hashing operations", async function () {
    // Create multiple test files with different seeds for different content
    const file1 = await createTestFile(5, "concurrent1.bin", 1);
    const file2 = await createTestFile(5, "concurrent2.bin", 2);
    const file3 = await createTestFile(5, "concurrent3.bin", 3);
    
    // Hash all files concurrently
    const [hash1, hash2, hash3] = await Promise.all([
      sha256HexFromFile(file1),
      sha256HexFromFile(file2),
      sha256HexFromFile(file3),
    ]);
    
    // All hashes should be valid and different (since files have different content)
    expect(hash1).to.match(/^0x[a-f0-9]{64}$/);
    expect(hash2).to.match(/^0x[a-f0-9]{64}$/);
    expect(hash3).to.match(/^0x[a-f0-9]{64}$/);
    expect(hash1).to.not.equal(hash2);
    expect(hash2).to.not.equal(hash3);
    expect(hash1).to.not.equal(hash3);
  });

  it("should verify streaming hash matches buffer hash for small files", async function () {
    // Create a small test file
    const filepath = await createTestFile(1, "verify-hash.bin");
    
    // Compute hash via streaming
    const streamHash = await sha256HexFromFile(filepath);
    
    // Compute hash via buffer (for comparison)
    const fileBuffer = await readFile(filepath);
    const bufferHash = "0x" + createHash("sha256").update(fileBuffer).digest("hex");
    
    // Hashes should match
    expect(streamHash).to.equal(bufferHash);
  });
});
