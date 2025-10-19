import { ethers } from "ethers";
import { readFile } from "fs/promises";
import * as path from "path";

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

// Helper to resolve default registry address for current network
export async function resolveDefaultRegistry(): Promise<RegistryInfo> {
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL || "https://sepolia.base.org"
  );
  const net = await provider.getNetwork();
  const chainId = Number(net.chainId);
  const override = process.env.REGISTRY_ADDRESS;
  if (override) return { registryAddress: override, chainId };
  let deployedFile: string | undefined;
  if (chainId === 84532)
    deployedFile = path.join(process.cwd(), "deployed", "baseSepolia.json");
  if (deployedFile) {
    try {
      const data = JSON.parse((await readFile(deployedFile)).toString("utf8"));
      if (data?.address) return { registryAddress: data.address, chainId };
    } catch {}
  }
  throw new Error("Registry address not configured");
}

export function getProvider(rpcUrl?: string): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(
    rpcUrl || process.env.RPC_URL || "https://sepolia.base.org"
  );
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
