import { prisma } from "../db";
import { cacheService } from "./cache.service";

/**
 * Upserts a user by wallet address
 * @param address The wallet address (should be lowercase)
 * @returns The user ID
 */
export async function upsertUser(address: string): Promise<string | undefined> {
  try {
    const user = await prisma.user.upsert({
      where: { address: address.toLowerCase() },
      create: { address: address.toLowerCase() },
      update: {},
    });
    return user.id;
  } catch (e) {
    console.warn("DB upsert user failed:", e);
    return undefined;
  }
}

/**
 * Upserts content record in the database
 * @param params Content upsert parameters
 * @returns The content record
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
    console.warn("DB upsert content failed:", e);
  }
}

/**
 * Upserts a platform binding in the database
 * @param params Platform binding parameters
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
    console.warn("DB upsert platform binding failed:", e);
  }
}
