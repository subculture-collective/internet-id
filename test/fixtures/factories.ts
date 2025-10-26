/**
 * Test data factories for integration tests
 * Provides reusable factory functions to create test data objects
 */

import { ethers } from "ethers";
import { createHash } from "crypto";

/**
 * Create a test user object
 */
export function createTestUser(
  overrides: Partial<{
    address: string;
    email: string;
    name: string;
  }> = {}
) {
  const randomId = Math.random().toString(36).substring(7);
  return {
    address: overrides.address || ethers.Wallet.createRandom().address.toLowerCase(),
    email: overrides.email || `test-${randomId}@example.com`,
    name: overrides.name || `Test User ${randomId}`,
  };
}

/**
 * Create test content data
 */
export function createTestContent(
  overrides: Partial<{
    contentHash: string;
    contentUri: string;
    manifestUri: string;
    creatorAddress: string;
  }> = {}
) {
  const randomData = Math.random().toString(36);
  const hash =
    overrides.contentHash || "0x" + createHash("sha256").update(randomData).digest("hex");

  return {
    contentHash: hash,
    contentUri: overrides.contentUri || undefined,
    manifestUri: overrides.manifestUri || `ipfs://Qm${randomData}`,
    creatorAddress: overrides.creatorAddress || ethers.Wallet.createRandom().address.toLowerCase(),
  };
}

/**
 * Create test platform binding data
 */
export function createTestBinding(
  overrides: Partial<{
    platform: string;
    platformId: string;
    contentHash: string;
  }> = {}
) {
  const randomId = Math.random().toString(36).substring(7);
  return {
    platform: overrides.platform || "youtube",
    platformId: overrides.platformId || `test-${randomId}`,
    contentHash: overrides.contentHash,
  };
}

/**
 * Create test file buffer with known hash
 */
export function createTestFile(content: string = "test content"): {
  buffer: Buffer;
  hash: string;
  originalname: string;
} {
  const buffer = Buffer.from(content);
  const hash = "0x" + createHash("sha256").update(buffer).digest("hex");
  return {
    buffer,
    hash,
    originalname: "test-file.txt",
  };
}

/**
 * Create test manifest object
 */
export function createTestManifest(contentHash: string, creatorAddress: string) {
  return {
    content_hash: contentHash,
    content_uri: "ipfs://QmTest123",
    creator: creatorAddress,
    timestamp: Math.floor(Date.now() / 1000),
    signature: "0x" + "00".repeat(65), // Placeholder signature
  };
}

/**
 * Generate a valid Ethereum signature for test manifest
 */
export async function signTestManifest(manifest: any, wallet: ethers.Wallet): Promise<string> {
  const message = JSON.stringify({
    content_hash: manifest.content_hash,
    content_uri: manifest.content_uri,
    creator: manifest.creator,
    timestamp: manifest.timestamp,
  });
  return await wallet.signMessage(message);
}
