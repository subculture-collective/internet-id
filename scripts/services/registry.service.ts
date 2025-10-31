import { ethers } from "ethers";
import { readFile } from "fs/promises";
import * as path from "path";
import { getChainById, SUPPORTED_CHAINS } from "../../config/chains";

export interface RegistryInfo {
  registryAddress: string;
  chainId: number;
}

export interface RegistryEntry {
  creator: string;
  contentHash: string;
  manifestURI: string;
  timestamp: number;
}

// Mapping of chain IDs to deployment file names
const CHAIN_DEPLOYMENT_FILES: Record<number, string> = {
  1: "ethereum.json",
  11155111: "sepolia.json",
  137: "polygon.json",
  80002: "polygonAmoy.json",
  8453: "base.json",
  84532: "baseSepolia.json",
  42161: "arbitrum.json",
  421614: "arbitrumSepolia.json",
  10: "optimism.json",
  11155420: "optimismSepolia.json",
  31337: "localhost.json",
};

// Helper to resolve default registry address for current network
export async function resolveDefaultRegistry(): Promise<RegistryInfo> {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://sepolia.base.org");
  const net = await provider.getNetwork();
  const chainId = Number(net.chainId);
  const override = process.env.REGISTRY_ADDRESS;
  if (override) return { registryAddress: override, chainId };

  const deployedFileName = CHAIN_DEPLOYMENT_FILES[chainId];
  if (deployedFileName) {
    const deployedFile = path.join(process.cwd(), "deployed", deployedFileName);
    try {
      const data = JSON.parse((await readFile(deployedFile)).toString("utf8"));
      if (data?.address) return { registryAddress: data.address, chainId };
    } catch (err) {
      console.error(`Failed to read or parse registry deployment file "${deployedFile}":`, err);
    }
  }
  throw new Error(`Registry address not configured for chain ID ${chainId}`);
}

// Helper to get registry address for a specific chain
export async function getRegistryAddress(chainId: number): Promise<string | undefined> {
  const deployedFileName = CHAIN_DEPLOYMENT_FILES[chainId];
  if (!deployedFileName) return undefined;

  const deployedFile = path.join(process.cwd(), "deployed", deployedFileName);
  try {
    const data = JSON.parse((await readFile(deployedFile)).toString("utf8"));
    return data?.address;
  } catch (err) {
    console.error(`Failed to read registry address from ${deployedFile}:`, err);
    return undefined;
  }
}

// Helper to get all deployed registry addresses
export async function getAllRegistryAddresses(): Promise<Record<number, string>> {
  const addresses: Record<number, string> = {};

  for (const [chainIdStr, fileName] of Object.entries(CHAIN_DEPLOYMENT_FILES)) {
    const chainId = parseInt(chainIdStr);
    const deployedFile = path.join(process.cwd(), "deployed", fileName);
    try {
      const data = JSON.parse((await readFile(deployedFile)).toString("utf8"));
      if (data?.address) {
        addresses[chainId] = data.address;
      }
    } catch (err) {
      // Skip if file doesn't exist - only log non-ENOENT errors
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`Failed to read registry file ${deployedFile}:`, err);
      }
    }
  }

  return addresses;
}

export function getProvider(rpcUrl?: string): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(
    rpcUrl || process.env.RPC_URL || SUPPORTED_CHAINS.baseSepolia.rpcUrl
  );
}

// Helper to get provider for a specific chain
export function getProviderForChain(chainId: number): ethers.JsonRpcProvider | undefined {
  const chain = getChainById(chainId);
  if (!chain) return undefined;
  return new ethers.JsonRpcProvider(chain.rpcUrl);
}

export function getRegistryContract(
  address: string,
  abi: string[],
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(address, abi, signerOrProvider);
}

export async function resolveByPlatform(
  registryAddress: string,
  platform: string,
  platformId: string,
  provider: ethers.Provider
): Promise<RegistryEntry> {
  const abi = [
    "function resolveByPlatform(string,string) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
  ];
  const registry = new ethers.Contract(registryAddress, abi, provider);
  const entry = await registry.resolveByPlatform(platform, platformId);
  return {
    creator: entry?.creator || ethers.ZeroAddress,
    contentHash: entry.contentHash as string,
    manifestURI: entry.manifestURI as string,
    timestamp: Number(entry.timestamp || 0),
  };
}

export async function getEntry(
  registryAddress: string,
  contentHash: string,
  provider: ethers.Provider
): Promise<RegistryEntry> {
  const abi = [
    "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
  ];
  const registry = new ethers.Contract(registryAddress, abi, provider);
  const entry = await registry.entries(contentHash);
  return {
    creator: entry?.creator || ethers.ZeroAddress,
    contentHash: entry.contentHash as string,
    manifestURI: entry.manifestURI as string,
    timestamp: Number(entry.timestamp || 0),
  };
}

export interface CrossChainRegistryEntry extends RegistryEntry {
  chainId: number;
  registryAddress: string;
}

/**
 * Resolve a platform binding across all supported chains
 * Returns the first match found, checking chains in priority order
 */
export async function resolveByPlatformCrossChain(
  platform: string,
  platformId: string
): Promise<CrossChainRegistryEntry | null> {
  const addresses = await getAllRegistryAddresses();
  const chainIds = Object.keys(addresses).map((id) => parseInt(id));

  // Check each chain in order
  for (const chainId of chainIds) {
    const registryAddress = addresses[chainId];
    const provider = getProviderForChain(chainId);
    if (!provider) continue;

    try {
      const entry = await resolveByPlatform(registryAddress, platform, platformId, provider);
      // Check if entry exists (creator is not zero address)
      if (entry.creator !== ethers.ZeroAddress) {
        return {
          ...entry,
          chainId,
          registryAddress,
        };
      }
    } catch (err) {
      console.error(
        `Failed to resolve platform binding on chainId ${chainId} (registry: ${registryAddress}):`,
        err
      );
      continue;
    }
  }

  return null;
}

/**
 * Get a content entry across all supported chains
 * Returns the first match found
 */
export async function getEntryCrossChain(
  contentHash: string
): Promise<CrossChainRegistryEntry | null> {
  const addresses = await getAllRegistryAddresses();
  const chainIds = Object.keys(addresses).map((id) => parseInt(id));

  for (const chainId of chainIds) {
    const registryAddress = addresses[chainId];
    const provider = getProviderForChain(chainId);
    if (!provider) continue;

    try {
      const entry = await getEntry(registryAddress, contentHash, provider);
      // Check if entry exists (creator is not zero address)
      if (entry.creator !== ethers.ZeroAddress) {
        return {
          ...entry,
          chainId,
          registryAddress,
        };
      }
    } catch (err) {
      console.error(
        `Failed to get entry on chainId ${chainId} (registry: ${registryAddress}):`,
        err
      );
      continue;
    }
  }

  return null;
}
