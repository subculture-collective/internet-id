/**
 * Integration test helper utilities
 * Provides common setup, teardown, and helper functions for integration tests
 */

import { ethers } from "ethers";
import { PrismaClient } from "@prisma/client";
import { Express } from "express";
import { createApp } from "../../scripts/app";

// Set DATABASE_URL before any imports that might use it
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    "postgresql://internetid:internetid@localhost:5432/internetid_test?schema=public";
}

/**
 * Test database instance
 * Uses the main database but with cleanup between tests
 */
export class TestDatabase {
  private prisma: PrismaClient;
  private isAvailable: boolean = false;

  constructor() {
    // Use the regular Prisma client which is already configured
    // Test isolation is achieved through cleanup
    const { prisma } = require("../../scripts/db");
    this.prisma = prisma;
  }

  async connect() {
    try {
      await this.prisma.$connect();
      // Test if database is actually reachable
      await this.prisma.$queryRaw`SELECT 1`;
      this.isAvailable = true;
    } catch (error) {
      console.warn("Database not available for integration tests:", error);
      this.isAvailable = false;
    }
  }

  async disconnect() {
    if (this.isAvailable) {
      await this.prisma.$disconnect();
    }
  }

  async cleanup() {
    if (!this.isAvailable) return;

    try {
      // Clean all tables in reverse order of dependencies
      await this.prisma.verification.deleteMany();
      await this.prisma.platformBinding.deleteMany();
      await this.prisma.content.deleteMany();
      await this.prisma.session.deleteMany();
      await this.prisma.account.deleteMany();
      await this.prisma.user.deleteMany();
      await this.prisma.verificationToken.deleteMany();
    } catch (error) {
      console.warn("Database cleanup failed:", error);
    }
  }

  getClient() {
    return this.prisma;
  }

  isDbAvailable() {
    return this.isAvailable;
  }
}

/**
 * Test blockchain environment using Hardhat network
 */
export class TestBlockchain {
  private provider: any;
  private signers: any[];
  private registry: any | null = null;

  constructor(provider?: any) {
    // Provider will be set during initialization
    this.provider = provider;
    this.signers = [];
  }

  async initialize() {
    // Get Hardhat's ethers and signers
    const hre = require("hardhat");
    this.signers = await hre.ethers.getSigners();
    this.provider = hre.ethers.provider;
  }

  async deployRegistry(signer?: any): Promise<string> {
    const deployer = signer || this.signers[0];

    // Deploy contract using Hardhat's ethers
    const hre = require("hardhat");
    const ContentRegistry = await hre.ethers.getContractFactory("ContentRegistry", deployer);
    const registry = await ContentRegistry.deploy();
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
    // Use test database or default for tests
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        process.env.TEST_DATABASE_URL ||
        "postgresql://internetid:internetid@localhost:5432/internetid_test?schema=public";
    }
    // Don't override RPC_URL - use Hardhat's network provider

    // Initialize components
    await this.db.connect();
    await this.blockchain.initialize();
    await this.server.start();
  }

  async cleanup() {
    await this.db.cleanup();
    await this.blockchain.resetNetwork();

    // Restore original environment (except DATABASE_URL which we keep for Prisma)
    Object.entries(this.originalEnv).forEach(([key, value]) => {
      if (key === "DATABASE_URL") return; // Don't restore DATABASE_URL to avoid Prisma issues
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
