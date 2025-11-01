import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import { readFile } from "fs/promises";
import * as path from "path";
import { resolveDefaultRegistry, resolveByPlatform } from "../services/registry.service";
import { parsePlatformInput } from "../services/platform.service";
import { fetchManifest } from "../services/manifest.service";
import { validateQuery } from "../validation/middleware";
import { resolveQuerySchema, publicVerifyQuerySchema } from "../validation/schemas";
import { cacheService, DEFAULT_TTL } from "../services/cache.service";
import { prisma } from "../db";
import { metricsService } from "../services/metrics.service";

const router = Router();

/**
 * Enhanced health check with detailed service status
 */
router.get("/health", async (_req: Request, res: Response) => {
  const checks: any = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  try {
    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.services.database = { status: "healthy" };
      metricsService.updateHealthCheckStatus("database", "healthy", true);
    } catch (dbError: any) {
      checks.services.database = {
        status: "unhealthy",
        error: dbError.message,
      };
      checks.status = "degraded";
      metricsService.updateHealthCheckStatus("database", "unhealthy", false);
    }

    // Check cache service
    const cacheAvailable = cacheService.isAvailable();
    checks.services.cache = {
      status: cacheAvailable ? "healthy" : "disabled",
      enabled: cacheAvailable,
    };
    metricsService.updateHealthCheckStatus(
      "cache",
      cacheAvailable ? "healthy" : "degraded",
      cacheAvailable
    );

    // Check blockchain RPC connectivity
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );
      const blockNumber = await provider.getBlockNumber();
      checks.services.blockchain = {
        status: "healthy",
        blockNumber,
      };
      metricsService.updateHealthCheckStatus("blockchain", "healthy", true);
    } catch (rpcError: any) {
      checks.services.blockchain = {
        status: "unhealthy",
        error: rpcError.message,
      };
      checks.status = "degraded";
      metricsService.updateHealthCheckStatus("blockchain", "unhealthy", false);
    }

    // Update overall health status metric
    const overallHealthy = checks.status === "ok";
    metricsService.updateHealthCheckStatus("api", checks.status, overallHealthy);

    const statusCode = checks.status === "ok" ? 200 : 503;
    res.status(statusCode).json(checks);
  } catch (error: any) {
    console.error("[Health] Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Cache metrics endpoint for observability
router.get("/cache/metrics", (_req: Request, res: Response) => {
  try {
    const metrics = cacheService.getMetrics();
    const isAvailable = cacheService.isAvailable();
    res.json({
      cacheEnabled: isAvailable,
      ...metrics,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Network info (for UI explorer links)
router.get("/network", async (_req: Request, res: Response) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://sepolia.base.org");
    const net = await provider.getNetwork();
    res.json({ chainId: Number(net.chainId) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Default registry address for current network
router.get("/registry", async (_req: Request, res: Response) => {
  try {
    const override = process.env.REGISTRY_ADDRESS;
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://sepolia.base.org");
    const net = await provider.getNetwork();
    const chainId = Number(net.chainId);
    if (override) return res.json({ registryAddress: override, chainId });

    // Attempt to map chainId to a deployed file in ./deployed
    let deployedFile: string | undefined;
    if (chainId === 84532) deployedFile = path.join(process.cwd(), "deployed", "baseSepolia.json");
    // Add more mappings here if other networks are deployed

    if (deployedFile) {
      try {
        const data = JSON.parse((await readFile(deployedFile)).toString("utf8"));
        if (data?.address) return res.json({ registryAddress: data.address, chainId });
      } catch (e) {
        // fallthrough
      }
    }
    return res.status(404).json({ error: "Registry address not configured", chainId });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Resolve binding by URL or platform+platformId - with caching
router.get("/resolve", validateQuery(resolveQuerySchema), async (req: Request, res: Response) => {
  try {
    const url = (req.query as any).url as string | undefined;
    const platform = (req.query as any).platform as string | undefined;
    const platformId = (req.query as any).platformId as string | undefined;
    const parsed = parsePlatformInput(url, platform, platformId);
    if (!parsed?.platform || !parsed.platformId) {
      return res.status(400).json({ error: "Provide url or platform + platformId" });
    }
    const { registryAddress, chainId } = await resolveDefaultRegistry();
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://sepolia.base.org");

    // Cache platform bindings
    const cacheKey = `binding:${parsed.platform}:${parsed.platformId}`;
    const entry = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await resolveByPlatform(
          registryAddress,
          parsed.platform,
          parsed.platformId,
          provider
        );
      },
      { ttl: DEFAULT_TTL.PLATFORM_BINDING }
    );

    if (entry.creator === ethers.ZeroAddress)
      return res.status(404).json({
        error: "No binding found",
        ...parsed,
        registryAddress,
        chainId,
      });
    return res.json({
      ...parsed,
      creator: entry.creator,
      contentHash: entry.contentHash,
      manifestURI: entry.manifestURI,
      timestamp: entry.timestamp,
      registryAddress,
      chainId,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

// Public verify: resolve + include manifest JSON if on IPFS/HTTP - with caching
router.get(
  "/public-verify",
  validateQuery(publicVerifyQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const url = (req.query as any).url as string | undefined;
      const platform = (req.query as any).platform as string | undefined;
      const platformId = (req.query as any).platformId as string | undefined;
      const parsed = parsePlatformInput(url, platform, platformId);
      if (!parsed?.platform || !parsed.platformId) {
        return res.status(400).json({ error: "Provide url or platform + platformId" });
      }
      const { registryAddress, chainId } = await resolveDefaultRegistry();
      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );

      // Cache platform binding resolution
      const bindingCacheKey = `binding:${parsed.platform}:${parsed.platformId}`;
      const entry = await cacheService.getOrSet(
        bindingCacheKey,
        async () => {
          return await resolveByPlatform(
            registryAddress,
            parsed.platform,
            parsed.platformId,
            provider
          );
        },
        { ttl: DEFAULT_TTL.PLATFORM_BINDING }
      );

      if (entry.creator === ethers.ZeroAddress)
        return res.status(404).json({
          error: "No binding found",
          ...parsed,
          registryAddress,
          chainId,
        });

      // Cache manifest fetching
      let manifest = null;
      try {
        const manifestCacheKey = `manifest:${entry.manifestURI}`;
        manifest = await cacheService.getOrSet(
          manifestCacheKey,
          async () => {
            return await fetchManifest(entry.manifestURI);
          },
          { ttl: DEFAULT_TTL.MANIFEST }
        );
      } catch (_error) {
        // Manifest fetch failed, continue without it
      }

      return res.json({
        ...parsed,
        creator: entry.creator,
        contentHash: entry.contentHash,
        manifestURI: entry.manifestURI,
        timestamp: entry.timestamp,
        registryAddress,
        chainId,
        manifest,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
