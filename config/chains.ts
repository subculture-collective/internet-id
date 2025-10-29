/**
 * Multi-chain configuration for Internet-ID
 * Contains RPC URLs, block explorers, chain IDs, and other chain-specific settings
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  displayName: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
  gasSettings?: {
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  // Ethereum
  ethereum: {
    chainId: 1,
    name: "ethereum",
    displayName: "Ethereum Mainnet",
    rpcUrl: process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    testnet: false,
  },
  sepolia: {
    chainId: 11155111,
    name: "sepolia",
    displayName: "Ethereum Sepolia",
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    testnet: true,
  },

  // Polygon
  polygon: {
    chainId: 137,
    name: "polygon",
    displayName: "Polygon",
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    testnet: false,
  },
  polygonAmoy: {
    chainId: 80002,
    name: "polygonAmoy",
    displayName: "Polygon Amoy",
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    testnet: true,
  },

  // Base
  base: {
    chainId: 8453,
    name: "base",
    displayName: "Base",
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    testnet: false,
  },
  baseSepolia: {
    chainId: 84532,
    name: "baseSepolia",
    displayName: "Base Sepolia",
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    testnet: true,
  },

  // Arbitrum
  arbitrum: {
    chainId: 42161,
    name: "arbitrum",
    displayName: "Arbitrum One",
    rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    testnet: false,
  },
  arbitrumSepolia: {
    chainId: 421614,
    name: "arbitrumSepolia",
    displayName: "Arbitrum Sepolia",
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    testnet: true,
  },

  // Optimism
  optimism: {
    chainId: 10,
    name: "optimism",
    displayName: "Optimism",
    rpcUrl: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
    blockExplorer: "https://optimistic.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    testnet: false,
  },
  optimismSepolia: {
    chainId: 11155420,
    name: "optimismSepolia",
    displayName: "Optimism Sepolia",
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
    blockExplorer: "https://sepolia-optimism.etherscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    testnet: true,
  },

  // Legacy localhost for testing
  localhost: {
    chainId: 31337,
    name: "localhost",
    displayName: "Localhost",
    rpcUrl: process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545",
    blockExplorer: "",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    testnet: true,
  },
};

/**
 * Get chain configuration by chain ID
 */
export function getChainById(chainId: number): ChainConfig | undefined {
  return Object.values(SUPPORTED_CHAINS).find((chain) => chain.chainId === chainId);
}

/**
 * Get chain configuration by name
 */
export function getChainByName(name: string): ChainConfig | undefined {
  return SUPPORTED_CHAINS[name];
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
export function getExplorerTxUrl(chainId: number, txHash: string): string | undefined {
  const chain = getChainById(chainId);
  if (!chain || !chain.blockExplorer) return undefined;
  return `${chain.blockExplorer}/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getExplorerAddressUrl(chainId: number, address: string): string | undefined {
  const chain = getChainById(chainId);
  if (!chain || !chain.blockExplorer) return undefined;
  return `${chain.blockExplorer}/address/${address}`;
}
