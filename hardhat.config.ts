import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";
import { SUPPORTED_CHAINS } from "./config/chains";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    outputFile: process.env.REPORT_GAS ? "gas-report.txt" : undefined,
    noColors: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  networks: {
    hardhat: {},
    localhost: {
      url: SUPPORTED_CHAINS.localhost.rpcUrl,
    },
    // Ethereum networks
    ethereum: {
      url: SUPPORTED_CHAINS.ethereum.rpcUrl,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: SUPPORTED_CHAINS.ethereum.chainId,
    },
    sepolia: {
      url: SUPPORTED_CHAINS.sepolia.rpcUrl,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: SUPPORTED_CHAINS.sepolia.chainId,
    },
    // Polygon networks
    polygon: {
      url: SUPPORTED_CHAINS.polygon.rpcUrl,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: SUPPORTED_CHAINS.polygon.chainId,
    },
    polygonAmoy: {
      url: SUPPORTED_CHAINS.polygonAmoy.rpcUrl,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: SUPPORTED_CHAINS.polygonAmoy.chainId,
    },
    // Base networks
    base: {
      url: SUPPORTED_CHAINS.base.rpcUrl,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: SUPPORTED_CHAINS.base.chainId,
    },
    baseSepolia: {
      url: process.env.RPC_URL || SUPPORTED_CHAINS.baseSepolia.rpcUrl,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: SUPPORTED_CHAINS.baseSepolia.chainId,
    },
    // Arbitrum networks
    arbitrum: {
      url: SUPPORTED_CHAINS.arbitrum.rpcUrl,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: SUPPORTED_CHAINS.arbitrum.chainId,
    },
    arbitrumSepolia: {
      url: SUPPORTED_CHAINS.arbitrumSepolia.rpcUrl,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: SUPPORTED_CHAINS.arbitrumSepolia.chainId,
    },
    // Optimism networks
    optimism: {
      url: SUPPORTED_CHAINS.optimism.rpcUrl,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: SUPPORTED_CHAINS.optimism.chainId,
    },
    optimismSepolia: {
      url: SUPPORTED_CHAINS.optimismSepolia.rpcUrl,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: SUPPORTED_CHAINS.optimismSepolia.chainId,
    },
  },
};

export default config;
