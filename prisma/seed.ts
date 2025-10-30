/**
 * Prisma seed script for local development
 *
 * This script populates the database with deterministic test data:
 * - Sample creator accounts
 * - Sample content entries (registered files)
 * - Platform bindings (YouTube, TikTok, GitHub, etc.)
 * - Verification records
 *
 * Usage:
 *   npm run db:seed
 *
 * To reset the database:
 *   npm run db:reset
 *
 * SECURITY NOTE:
 * - All test data uses deterministic but fake addresses
 * - No real private keys or secrets are used
 * - This data should NEVER be used in production
 */

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { ethers } from "ethers";

const prisma = new PrismaClient();

// Deterministic test wallets (derived from known mnemonics for testing only)
// These are PUBLIC test keys - NEVER use for real funds
const TEST_MNEMONIC = "test test test test test test test test test test test junk";

/**
 * Generate deterministic test wallets
 */
function generateTestWallets(count: number): ethers.HDNodeWallet[] {
  const wallets: ethers.HDNodeWallet[] = [];
  for (let i = 0; i < count; i++) {
    const path = `m/44'/60'/0'/0/${i}`;
    const wallet = ethers.HDNodeWallet.fromPhrase(TEST_MNEMONIC, undefined, path);
    wallets.push(wallet);
  }
  return wallets;
}

/**
 * Generate a deterministic content hash from a seed string
 */
function generateContentHash(seed: string): string {
  return "0x" + createHash("sha256").update(seed).digest("hex");
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Generate test wallets
  const wallets = generateTestWallets(5);
  console.log(`📝 Generated ${wallets.length} test wallets`);

  // Create test users
  console.log("\n👥 Creating test users...");
  const users = await Promise.all(
    wallets.map(async (wallet, index) => {
      const user = await prisma.user.upsert({
        where: { address: wallet.address.toLowerCase() },
        update: {},
        create: {
          address: wallet.address.toLowerCase(),
          email: `creator${index + 1}@example.com`,
          name: `Test Creator ${index + 1}`,
          emailVerified: new Date(),
        },
      });
      console.log(
        `  ✓ Created user: ${user.name} (${user.address?.substring(0, 10) || "unknown"}...)`
      );
      return user;
    })
  );

  // Create test content entries
  console.log("\n📄 Creating test content entries...");
  const contentSeeds = [
    {
      seed: "test-video-1.mp4",
      uri: "ipfs://QmTestVideo1ABC123",
      manifestCid: "QmManifest1ABC123",
      description: "Sample promotional video",
    },
    {
      seed: "test-image-1.jpg",
      uri: "ipfs://QmTestImage1DEF456",
      manifestCid: "QmManifest2DEF456",
      description: "Sample artwork image",
    },
    {
      seed: "test-audio-1.mp3",
      uri: "ipfs://QmTestAudio1GHI789",
      manifestCid: "QmManifest3GHI789",
      description: "Sample podcast episode",
    },
    {
      seed: "test-document-1.pdf",
      uri: "ipfs://QmTestDoc1JKL012",
      manifestCid: "QmManifest4JKL012",
      description: "Sample whitepaper",
    },
    {
      seed: "test-video-2.mp4",
      uri: "ipfs://QmTestVideo2MNO345",
      manifestCid: "QmManifest5MNO345",
      description: "Sample tutorial video",
    },
  ];

  const contents = await Promise.all(
    contentSeeds.map(async (seed, index) => {
      const wallet = wallets[index % wallets.length];
      const contentHash = generateContentHash(seed.seed);
      const manifestUri = `ipfs://${seed.manifestCid}`;

      const content = await prisma.content.upsert({
        where: { contentHash },
        update: {},
        create: {
          contentHash,
          contentUri: seed.uri,
          manifestCid: seed.manifestCid,
          manifestUri,
          creatorAddress: wallet.address.toLowerCase(),
          creatorId: users[index % users.length].id,
          registryAddress: "0x1234567890123456789012345678901234567890", // Mock registry
          txHash: `0x${createHash("sha256").update(`tx-${seed.seed}`).digest("hex")}`,
        },
      });
      console.log(`  ✓ Created content: ${seed.description} (${contentHash.substring(0, 18)}...)`);
      return content;
    })
  );

  // Create platform bindings
  console.log("\n🔗 Creating platform bindings...");
  const bindings = [
    // YouTube bindings
    { platform: "youtube", platformId: "dQw4w9WgXcQ", contentIndex: 0, name: "YouTube Video 1" },
    { platform: "youtube", platformId: "jNQXAC9IVRw", contentIndex: 1, name: "YouTube Video 2" },
    { platform: "youtube", platformId: "9bZkp7q19f0", contentIndex: 4, name: "YouTube Tutorial" },

    // TikTok bindings
    {
      platform: "tiktok",
      platformId: "7123456789012345678",
      contentIndex: 0,
      name: "TikTok Video 1",
    },
    {
      platform: "tiktok",
      platformId: "7234567890123456789",
      contentIndex: 2,
      name: "TikTok Audio",
    },

    // GitHub bindings
    { platform: "github", platformId: "octocat/Hello-World", contentIndex: 3, name: "GitHub Repo" },
    {
      platform: "github",
      platformId: "torvalds/linux",
      contentIndex: 3,
      name: "Linux Kernel Repo",
    },

    // Instagram bindings
    { platform: "instagram", platformId: "CTestPost123", contentIndex: 1, name: "Instagram Post" },

    // Discord bindings
    {
      platform: "discord",
      platformId: "123456789012345678",
      contentIndex: 2,
      name: "Discord Message",
    },

    // LinkedIn bindings
    {
      platform: "linkedin",
      platformId: "test-article-123",
      contentIndex: 3,
      name: "LinkedIn Article",
    },
  ];

  await Promise.all(
    bindings.map(async (binding) => {
      const platformBinding = await prisma.platformBinding.upsert({
        where: {
          platform_platformId: {
            platform: binding.platform,
            platformId: binding.platformId,
          },
        },
        update: {},
        create: {
          platform: binding.platform,
          platformId: binding.platformId,
          contentId: contents[binding.contentIndex].id,
        },
      });
      console.log(`  ✓ Created ${binding.platform} binding: ${binding.name}`);
      return platformBinding;
    })
  );

  // Create verification records
  console.log("\n✅ Creating verification records...");
  const verifications = await Promise.all(
    contents.slice(0, 3).map(async (content, index) => {
      const wallet = wallets[index % wallets.length];
      const verification = await prisma.verification.create({
        data: {
          contentHash: content.contentHash,
          manifestUri: content.manifestUri || "ipfs://QmUnknown",
          recoveredAddress: wallet.address.toLowerCase(),
          creatorOnchain: wallet.address.toLowerCase(),
          status: index === 0 ? "verified" : index === 1 ? "verified" : "signature_mismatch",
          contentId: content.id,
        },
      });
      console.log(
        `  ✓ Created verification: ${verification.status} (${content.contentHash.substring(0, 18)}...)`
      );
      return verification;
    })
  );

  // Summary
  console.log("\n📊 Seed Summary:");
  console.log(`  - Users: ${users.length}`);
  console.log(`  - Contents: ${contents.length}`);
  console.log(`  - Platform Bindings: ${bindings.length}`);
  console.log(`  - Verifications: ${verifications.length}`);

  console.log("\n✨ Database seeded successfully!");
  console.log("\n💡 Test Accounts:");
  wallets.forEach((wallet, index) => {
    console.log(`  Creator ${index + 1}: ${wallet.address}`);
  });

  console.log("\n⚠️  NOTE: These are test accounts only. Never use for production or real funds!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
