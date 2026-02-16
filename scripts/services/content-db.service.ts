import { prisma } from "../db";
import { cacheService } from "./cache.service";
import { logger } from "./logger.service";
import { sentryService } from "./sentry.service";

/**
 * Upserts a user by wallet address
 * @param address The wallet address (should be lowercase)
 * @returns The user ID
 * @throws Error if database operation fails
 */
export async function upsertUser(address: string): Promise<string> {
  try {
    const user = await prisma.user.upsert({
      where: { address: address.toLowerCase() },
      create: { address: address.toLowerCase() },
      update: {},
    });
    return user.id;
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error("DB upsert user failed", error, {
      operation: "upsertUser",
      table: "user",
      address: address.toLowerCase(),
    });
    sentryService.captureException(error, {
      operation: "upsertUser",
      table: "user",
      address: address.toLowerCase(),
    });
    throw error;
  }
}

/**
 * Upserts content record in the database
 * @param params Content upsert parameters
 * @throws Error if database operation fails
 */
export async function upsertContent(params: {
  contentHash: string;
  contentUri?: string;
  manifestUri: string;
  manifestCid?: string;
  creatorAddress: string;
  creatorId?: string;
  registryAddress: string;
  txHash?: string;
}): Promise<void> {
  try {
    await prisma.content.upsert({
      where: { contentHash: params.contentHash },
      create: {
        contentHash: params.contentHash,
        contentUri: params.contentUri,
        manifestCid: params.manifestCid,
        manifestUri: params.manifestUri,
        creatorAddress: params.creatorAddress.toLowerCase(),
        creatorId: params.creatorId,
        registryAddress: params.registryAddress,
        txHash: params.txHash,
      },
      update: {
        manifestCid: params.manifestCid,
        manifestUri: params.manifestUri,
        registryAddress: params.registryAddress,
        txHash: params.txHash,
      },
    });

    // Invalidate content cache after upsert
    await cacheService.delete(`content:${params.contentHash}`);
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error("DB upsert content failed", error, {
      operation: "upsertContent",
      table: "content",
      contentHash: params.contentHash,
      registryAddress: params.registryAddress,
    });
    sentryService.captureException(error, {
      operation: "upsertContent",
      table: "content",
      contentHash: params.contentHash,
      registryAddress: params.registryAddress,
    });
    throw error;
  }
}

/**
 * Upserts a platform binding in the database
 * @param params Platform binding parameters
 * @throws Error if database operation fails
 */
export async function upsertPlatformBinding(params: {
  platform: string;
  platformId: string;
  contentHash: string;
}): Promise<void> {
  try {
    const content = await prisma.content.findUnique({
      where: { contentHash: params.contentHash },
    });
    
    await prisma.platformBinding.upsert({
      where: { 
        platform_platformId: { 
          platform: params.platform, 
          platformId: params.platformId 
        } 
      },
      create: { 
        platform: params.platform, 
        platformId: params.platformId, 
        contentId: content?.id 
      },
      update: { 
        contentId: content?.id 
      },
    });

    // Invalidate binding cache after upsert
    await cacheService.delete(`binding:${params.platform}:${params.platformId}`);
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error("DB upsert platform binding failed", error, {
      operation: "upsertPlatformBinding",
      table: "platformBinding",
      platform: params.platform,
      platformId: params.platformId,
      contentHash: params.contentHash,
    });
    sentryService.captureException(error, {
      operation: "upsertPlatformBinding",
      table: "platformBinding",
      platform: params.platform,
      platformId: params.platformId,
      contentHash: params.contentHash,
    });
    throw error;
  }
}
