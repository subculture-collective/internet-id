/**
 * Tests for database seed functionality
 */

import { expect } from "chai";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

describe("Database Seed", () => {
  let prisma: PrismaClient;

  before(() => {
    // Check if database is available
    try {
      const dbUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
      if (!dbUrl) {
        console.log("Skipping seed tests: No DATABASE_URL configured");
        return;
      }
      prisma = new PrismaClient();
    } catch (error) {
      console.log("Skipping seed tests: Database not available");
    }
  });

  after(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  describe("Seed Script Structure", () => {
    it("should have a valid seed script file", () => {
      const fs = require("fs");
      const seedPath = "./prisma/seed.ts";
      expect(fs.existsSync(seedPath)).to.be.true;
    });

    it("should have seed configuration in package.json", () => {
      const packageJson = require("../package.json");
      expect(packageJson.prisma).to.exist;
      expect(packageJson.prisma.seed).to.equal("ts-node prisma/seed.ts");
    });

    it("should have db:seed script in package.json", () => {
      const packageJson = require("../package.json");
      expect(packageJson.scripts["db:seed"]).to.equal("ts-node prisma/seed.ts");
    });

    it("should have db:reset script in package.json", () => {
      const packageJson = require("../package.json");
      expect(packageJson.scripts["db:reset"]).to.equal(
        "prisma migrate reset --force && npm run db:seed"
      );
    });
  });

  describe("Seed Documentation", () => {
    it("should have SEED_DATA.md documentation", () => {
      const fs = require("fs");
      const docPath = "./prisma/SEED_DATA.md";
      expect(fs.existsSync(docPath)).to.be.true;
    });

    it("should document seed usage in README.md", () => {
      const fs = require("fs");
      const readme = fs.readFileSync("./README.md", "utf-8");
      expect(readme).to.include("db:seed");
      expect(readme).to.include("db:reset");
    });

    it("should document seed in .env.example", () => {
      const fs = require("fs");
      const envExample = fs.readFileSync("./.env.example", "utf-8");
      expect(envExample).to.include("Database Seed Data");
    });
  });

  describe("Seeded Data Validation", function () {
    // Skip if database is not available
    before(function () {
      if (!prisma) {
        this.skip();
      }
    });

    it("should have seeded users", async () => {
      const count = await prisma.user.count();
      expect(count).to.be.greaterThan(0);
    });

    it("should have seeded content entries", async () => {
      const count = await prisma.content.count();
      expect(count).to.be.greaterThan(0);
    });

    it("should have seeded platform bindings", async () => {
      const count = await prisma.platformBinding.count();
      expect(count).to.be.greaterThan(0);
    });

    it("should have deterministic user addresses", async () => {
      // Check for the first test wallet address (from the standard test mnemonic)
      const expectedAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
      const user = await prisma.user.findFirst({
        where: { address: expectedAddress },
      });
      expect(user).to.exist;
      expect(user?.name).to.include("Test Creator");
    });

    it("should have valid platform bindings with content", async () => {
      const binding = await prisma.platformBinding.findFirst({
        include: { content: true },
      });
      expect(binding).to.exist;
      expect(binding?.platform).to.be.a("string");
      expect(binding?.platformId).to.be.a("string");
      expect(binding?.content).to.exist;
      expect(binding?.content?.contentHash).to.match(/^0x[a-f0-9]{64}$/);
    });

    it("should have YouTube bindings", async () => {
      const youtubeBinding = await prisma.platformBinding.findFirst({
        where: { platform: "youtube" },
      });
      expect(youtubeBinding).to.exist;
    });

    it("should have TikTok bindings", async () => {
      const tiktokBinding = await prisma.platformBinding.findFirst({
        where: { platform: "tiktok" },
      });
      expect(tiktokBinding).to.exist;
    });

    it("should have GitHub bindings", async () => {
      const githubBinding = await prisma.platformBinding.findFirst({
        where: { platform: "github" },
      });
      expect(githubBinding).to.exist;
    });
  });
});
