/**
 * Integration test helper utilities
 * Provides common setup, teardown, and helper functions for integration tests
 */

import { ethers } from "ethers";
import { PrismaClient } from "@prisma/client";
import { Express } from "express";
import { createApp } from "../../scripts/app";

/**
 * Test database instance
 * Uses the main database but with cleanup between tests
 */
export class TestDatabase {
  private prisma: PrismaClient;

  constructor() {
    // Use the regular Prisma client which is already configured
    // Test isolation is achieved through cleanup
    const { prisma } = require("../../scripts/db");
    this.prisma = prisma;
  }

  async connect() {
    await this.prisma.$connect();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  async cleanup() {
    // Clean all tables in reverse order of dependencies
    await this.prisma.verification.deleteMany();
    await this.prisma.platformBinding.deleteMany();
    await this.prisma.content.deleteMany();
    await this.prisma.session.deleteMany();
    await this.prisma.account.deleteMany();
    await this.prisma.user.deleteMany();
    await this.prisma.verificationToken.deleteMany();
  }

  getClient() {
    return this.prisma;
  }
}

/**
 * Test blockchain environment using Hardhat network
 */
export class TestBlockchain {
  private provider: ethers.Provider;
  private signers: ethers.Wallet[];
  private registry: ethers.Contract | null = null;

  constructor(provider?: ethers.Provider) {
    this.provider = provider || new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    this.signers = [];
  }

  async initialize() {
    // Use Hardhat's default test private keys
    const hardhatKeys = [
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    ];
    
    this.signers = hardhatKeys.map(key => new ethers.Wallet(key, this.provider));
  }

  async deployRegistry(signer?: ethers.Signer): Promise<string> {
    const deployer = signer || this.signers[0];
    
    // Deploy contract using ethers ContractFactory
    const abi = [
      "constructor()",
      "function register(bytes32 contentHash, string manifestURI) external",
      "function updateManifest(bytes32 contentHash, string newManifestURI) external",
      "function revoke(bytes32 contentHash) external",
      "function bindPlatform(bytes32 contentHash, string platform, string platformId) external",
      "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      "function resolvePlatform(string platform, string platformId) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      "function platformToHash(bytes32) view returns (bytes32)",
      "event ContentRegistered(bytes32 indexed contentHash, address indexed creator, string manifestURI, uint64 timestamp)",
      "event ManifestUpdated(bytes32 indexed contentHash, string manifestURI, uint64 timestamp)",
      "event EntryRevoked(bytes32 indexed contentHash, uint64 timestamp)",
      "event PlatformBound(bytes32 indexed contentHash, string indexed platform, string platformId)"
    ];
    
    // Get the bytecode from compiled artifacts
    const hre = require("hardhat");
    const artifact = await hre.artifacts.readArtifact("ContentRegistry");
    
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    const registry = await factory.deploy();
    await registry.waitForDeployment();
    
    this.registry = registry;
    return await registry.getAddress();
  }

  async resetNetwork() {
    // For Hardhat network in tests, we don't need to reset
    // The network state is already isolated per test
  }

  getProvider() {
    return this.provider;
  }

  getSigner(index: number = 0) {
    return this.signers[index];
  }

  getRegistry() {
    return this.registry;
  }
}

/**
 * Test server wrapper for API testing
 */
export class TestServer {
  private app: Express | null = null;

  async start() {
    this.app = await createApp();
    return this.app;
  }

  getApp() {
    if (!this.app) {
      throw new Error("Test server not started. Call start() first.");
    }
    return this.app;
  }
}

/**
 * Complete integration test environment
 */
export class IntegrationTestEnvironment {
  public db: TestDatabase;
  public blockchain: TestBlockchain;
  public server: TestServer;
  private originalEnv: Record<string, string | undefined>;

  constructor() {
    this.db = new TestDatabase();
    this.blockchain = new TestBlockchain();
    this.server = new TestServer();
    this.originalEnv = {};
  }

  async setup() {
    // Save original environment
    this.originalEnv = {
      DATABASE_URL: process.env.DATABASE_URL,
      RPC_URL: process.env.RPC_URL,
      LOCAL_RPC_URL: process.env.LOCAL_RPC_URL,
    };

    // Set test environment variables
    // Use test database or default to in-memory SQLite for tests
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 
        "postgresql://internetid:internetid@localhost:5432/internetid_test?schema=public";
    }
    process.env.RPC_URL = "http://127.0.0.1:8545";
    process.env.LOCAL_RPC_URL = "http://127.0.0.1:8545";

    // Initialize components
    await this.db.connect();
    await this.blockchain.initialize();
    await this.server.start();
  }

  async cleanup() {
    await this.db.cleanup();
    await this.blockchain.resetNetwork();
    
    // Restore original environment
    Object.entries(this.originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }

  async teardown() {
    await this.db.disconnect();
    // Note: Server doesn't need explicit teardown
  }
}
