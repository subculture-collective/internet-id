/**
 * Multi-chain configuration for web app
 * Contains chain IDs, block explorers, and other chain-specific settings
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  displayName: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  // Ethereum
  1: {
    chainId: 1,
    name: "ethereum",
    displayName: "Ethereum Mainnet",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    testnet: false,
  },
  11155111: {
    chainId: 11155111,
    name: "sepolia",
    displayName: "Ethereum Sepolia",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    testnet: true,
  },

  // Polygon
  137: {
    chainId: 137,
    name: "polygon",
    displayName: "Polygon",
    blockExplorer: "https://polygonscan.com",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    testnet: false,
  },
  80002: {
    chainId: 80002,
    name: "polygonAmoy",
    displayName: "Polygon Amoy",
    blockExplorer: "https://amoy.polygonscan.com",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    testnet: true,
  },

  // Base
  8453: {
    chainId: 8453,
    name: "base",
    displayName: "Base",
    blockExplorer: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    testnet: false,
  },
  84532: {
    chainId: 84532,
    name: "baseSepolia",
    displayName: "Base Sepolia",
    blockExplorer: "https://sepolia.basescan.org",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    testnet: true,
  },

  // Arbitrum
  42161: {
    chainId: 42161,
    name: "arbitrum",
    displayName: "Arbitrum One",
    blockExplorer: "https://arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    testnet: false,
  },
  421614: {
    chainId: 421614,
    name: "arbitrumSepolia",
    displayName: "Arbitrum Sepolia",
    blockExplorer: "https://sepolia.arbiscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    testnet: true,
  },

  // Optimism
  10: {
    chainId: 10,
    name: "optimism",
    displayName: "Optimism",
    blockExplorer: "https://optimistic.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    testnet: false,
  },
  11155420: {
    chainId: 11155420,
    name: "optimismSepolia",
    displayName: "Optimism Sepolia",
    blockExplorer: "https://sepolia-optimism.etherscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    testnet: true,
  },
};

/**
 * Get chain configuration by chain ID
 */
export function getChainById(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS[chainId];
}

/**
 * Get all mainnet chains
 */
export function getMainnetChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter((chain) => !chain.testnet);
}

/**
 * Get all testnet chains
 */
export function getTestnetChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter((chain) => chain.testnet);
}

/**
 * Get block explorer URL for a transaction
 */
export function getExplorerTxUrl(
  chainId: number | undefined,
  txHash: string | undefined
): string | undefined {
  if (!chainId || !txHash) return undefined;
  const chain = getChainById(chainId);
  if (!chain || !chain.blockExplorer) return undefined;
  return `${chain.blockExplorer}/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getExplorerAddressUrl(
  chainId: number | undefined,
  address: string | undefined
): string | undefined {
  if (!chainId || !address) return undefined;
  const chain = getChainById(chainId);
  if (!chain || !chain.blockExplorer) return undefined;
  return `${chain.blockExplorer}/address/${address}`;
}
