/**
 * Utility functions for blockchain block range calculations
 */

import { ethers } from "ethers";

/**
 * Get a safe starting block number for event queries
 * 
 * @param provider - The ethers provider
 * @returns A safe starting block number
 * 
 * Uses REGISTRY_START_BLOCK environment variable if set and valid,
 * otherwise defaults to (current block - 1,000,000) to avoid scanning entire chain history.
 * 
 * @example
 * ```typescript
 * const provider = new ethers.JsonRpcProvider(rpcUrl);
 * const startBlock = await getStartBlock(provider);
 * const logs = await provider.getLogs({
 *   address: registryAddress,
 *   fromBlock: startBlock,
 *   toBlock: "latest",
 *   topics: [topic0, contentHash],
 * });
 * ```
 */
export async function getStartBlock(provider: ethers.JsonRpcProvider): Promise<number> {
  // Try to use configured starting block from environment
  if (process.env.REGISTRY_START_BLOCK) {
    const parsed = parseInt(process.env.REGISTRY_START_BLOCK, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  
  // Default to last 1 million blocks (avoids full chain scan while being comprehensive)
  const currentBlock = await provider.getBlockNumber();
  return Math.max(0, currentBlock - 1000000);
}
