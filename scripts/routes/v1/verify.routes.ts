import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import { optionalAuthentication, AuthenticatedRequest } from "../../middleware/api-auth.middleware";
import { resolveDefaultRegistry, resolveByPlatform } from "../../services/registry.service";
import { parsePlatformInput } from "../../services/platform.service";
import { fetchManifest } from "../../services/manifest.service";
import { cacheService, DEFAULT_TTL } from "../../services/cache.service";

const router = Router();

/**
 * @swagger
 * /verify/platform:
 *   get:
 *     tags:
 *       - Verification
 *     summary: Verify content by platform binding
 *     description: Verifies content authenticity using platform-specific identifiers (YouTube, TikTok, etc.)
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         description: Full platform URL (e.g., https://youtube.com/watch?v=xyz)
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *         description: Platform name (youtube, tiktok, instagram, etc.)
 *       - in: query
 *         name: platformId
 *         schema:
 *           type: string
 *         description: Platform-specific content ID
 *     responses:
 *       200:
 *         description: Verification successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerificationResult'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No binding found for this content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/platform",
  optionalAuthentication,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { url, platform, platformId } = req.query as {
        url?: string;
        platform?: string;
        platformId?: string;
      };

      const parsed = parsePlatformInput(url, platform, platformId);
      if (!parsed?.platform || !parsed.platformId) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Provide url or both platform and platformId",
        });
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

      if (entry.creator === ethers.ZeroAddress) {
        return res.status(404).json({
          verified: false,
          error: "No binding found",
          platform: parsed.platform,
          platformId: parsed.platformId,
          registryAddress,
          chainId,
        });
      }

      // Fetch manifest if available
      let manifest: any = null;
      try {
        const manifestCacheKey = `manifest:${entry.manifestURI}`;
        manifest = await cacheService.getOrSet(
          manifestCacheKey,
          async () => {
            return await fetchManifest(entry.manifestURI);
          },
          { ttl: DEFAULT_TTL.MANIFEST }
        );
      } catch {}

      return res.json({
        verified: true,
        platform: parsed.platform,
        platformId: parsed.platformId,
        creator: entry.creator,
        contentHash: entry.contentHash,
        manifestURI: entry.manifestURI,
        timestamp: entry.timestamp,
        registryAddress,
        chainId,
        manifest,
      });
    } catch (e: any) {
      return res.status(500).json({
        error: "Verification failed",
        message: e?.message || String(e),
      });
    }
  }
);

/**
 * GET /api/v1/verify/hash/:hash
 * Verify content by content hash
 */
router.get(
  "/hash/:hash",
  optionalAuthentication,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { hash } = req.params;
      
      if (!hash || !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
        return res.status(400).json({
          error: "Invalid hash format",
          message: "Hash must be a 32-byte hex string with 0x prefix",
        });
      }

      const { registryAddress, chainId } = await resolveDefaultRegistry();
      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );

      const abi = [
        "function entries(bytes32) view returns (address creator, string manifestURI, uint256 timestamp, bool revoked)",
      ];
      const registry = new ethers.Contract(registryAddress, abi, provider);

      const cacheKey = `entry:${hash}`;
      const entry = await cacheService.getOrSet(
        cacheKey,
        async () => {
          const result = await registry.entries(hash);
          return {
            creator: result.creator,
            manifestURI: result.manifestURI,
            timestamp: Number(result.timestamp),
            revoked: result.revoked,
          };
        },
        { ttl: DEFAULT_TTL.CONTENT_METADATA }
      );

      if (entry.creator === ethers.ZeroAddress) {
        return res.status(404).json({
          verified: false,
          error: "Content not registered",
          contentHash: hash,
          registryAddress,
          chainId,
        });
      }

      // Fetch manifest if available
      let manifest: any = null;
      try {
        const manifestCacheKey = `manifest:${entry.manifestURI}`;
        manifest = await cacheService.getOrSet(
          manifestCacheKey,
          async () => {
            return await fetchManifest(entry.manifestURI);
          },
          { ttl: DEFAULT_TTL.MANIFEST }
        );
      } catch {}

      return res.json({
        verified: !entry.revoked,
        contentHash: hash,
        creator: entry.creator,
        manifestURI: entry.manifestURI,
        timestamp: entry.timestamp,
        revoked: entry.revoked,
        registryAddress,
        chainId,
        manifest,
      });
    } catch (e: any) {
      return res.status(500).json({
        error: "Verification failed",
        message: e?.message || String(e),
      });
    }
  }
);

export default router;
