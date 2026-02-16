import { ethers } from "ethers";

/**
 * Creates a JSON RPC provider
 * @param rpcUrl Optional RPC URL, falls back to RPC_URL environment variable
 * @returns ethers.JsonRpcProvider instance
 * @throws Error if neither rpcUrl nor RPC_URL environment variable is set
 */
export function createProvider(rpcUrl?: string): ethers.JsonRpcProvider {
  const url = rpcUrl || process.env.RPC_URL;
  
  if (!url) {
    throw new Error(
      "RPC_URL environment variable is required. " +
      "Set RPC_URL in your .env file to configure the blockchain network endpoint. " +
      "See .env.example for configuration examples."
    );
  }
  
  return new ethers.JsonRpcProvider(url);
}

/**
 * Creates a wallet instance connected to a provider
 * @param privateKey The private key for the wallet
 * @param provider The provider to connect the wallet to
 * @returns ethers.Wallet instance
 * @throws Error if privateKey is not provided
 */
export function createWallet(
  privateKey: string | undefined,
  provider: ethers.JsonRpcProvider
): ethers.Wallet {
  if (!privateKey) {
    throw new Error("PRIVATE_KEY missing in env");
  }
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Creates a wallet with provider in one call
 * @param privateKey Optional private key (defaults to PRIVATE_KEY env var)
 * @param rpcUrl Optional RPC URL
 * @returns Object containing provider and wallet
 * @throws Error if privateKey is not provided or not in environment
 */
export function createProviderAndWallet(
  privateKey?: string,
  rpcUrl?: string
): { provider: ethers.JsonRpcProvider; wallet: ethers.Wallet } {
  const provider = createProvider(rpcUrl);
  const pk = privateKey || process.env.PRIVATE_KEY;
  const wallet = createWallet(pk, provider);
  return { provider, wallet };
}

/**
 * Creates a registry contract instance
 * @param registryAddress The address of the registry contract
 * @param abi The ABI of the registry contract
 * @param signerOrProvider The signer or provider to connect the contract to
 * @returns ethers.Contract instance
 */
export function createRegistryContract(
  registryAddress: string,
  abi: string[],
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(registryAddress, abi, signerOrProvider);
}
