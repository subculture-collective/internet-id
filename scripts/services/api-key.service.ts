import { createHash, randomBytes } from "crypto";
import { prisma } from "../db";

export interface ApiKeyTier {
  name: string;
  rateLimit: number;
}

export const API_KEY_TIERS: Record<string, ApiKeyTier> = {
  free: { name: "free", rateLimit: 100 },
  paid: { name: "paid", rateLimit: 1000 },
};

/**
 * Generate a new API key
 * Format: iid_<random_string>
 */
function generateApiKey(): string {
  const random = randomBytes(32).toString("hex");
  return `iid_${random}`;
}

/**
 * Hash an API key for storage
 */
function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
  userId: string,
  name?: string,
  tier: string = "free",
  expiresAt?: Date
) {
  const plainKey = generateApiKey();
  const hashedKey = hashApiKey(plainKey);
  const tierConfig = API_KEY_TIERS[tier] || API_KEY_TIERS.free;

  const apiKey = await prisma.apiKey.create({
    data: {
      key: hashedKey,
      name: name || `API Key ${new Date().toISOString().split("T")[0]}`,
      userId,
      tier,
      rateLimit: tierConfig.rateLimit,
      expiresAt,
    },
  });

  // Return the plain key only once
  return {
    id: apiKey.id,
    key: plainKey, // Only returned on creation
    name: apiKey.name,
    tier: apiKey.tier,
    rateLimit: apiKey.rateLimit,
    createdAt: apiKey.createdAt,
    expiresAt: apiKey.expiresAt,
  };
}

/**
 * Verify an API key and return associated user info
 */
export async function verifyApiKey(plainKey: string) {
  const hashedKey = hashApiKey(plainKey);
  
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      key: hashedKey,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      user: true,
    },
  });

  if (!apiKey) {
    return null;
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    id: apiKey.id,
    userId: apiKey.userId,
    user: apiKey.user,
    tier: apiKey.tier,
    rateLimit: apiKey.rateLimit,
  };
}

/**
 * List API keys for a user (without exposing the actual keys)
 */
export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      tier: true,
      rateLimit: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, userId: string) {
  return prisma.apiKey.updateMany({
    where: {
      id: keyId,
      userId,
    },
    data: {
      isActive: false,
    },
  });
}

/**
 * Delete an API key
 */
export async function deleteApiKey(keyId: string, userId: string) {
  return prisma.apiKey.deleteMany({
    where: {
      id: keyId,
      userId,
    },
  });
}
