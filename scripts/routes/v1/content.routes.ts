import { Router, Request, Response } from "express";
import { optionalAuthentication, AuthenticatedRequest } from "../../middleware/api-auth.middleware";
import { prisma } from "../../db";
import { cacheService, DEFAULT_TTL } from "../../services/cache.service";

const router = Router();

/**
 * GET /api/v1/content
 * List registered content with pagination
 * Query params: limit, offset, creator
 */
router.get(
  "/",
  optionalAuthentication,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const creator = req.query.creator as string | undefined;

      const where = creator ? { creatorAddress: creator } : {};

      const cacheKey = `contents:${creator || "all"}:${limit}:${offset}`;
      const result = await cacheService.getOrSet(
        cacheKey,
        async () => {
          const [items, total] = await Promise.all([
            prisma.content.findMany({
              where,
              take: limit,
              skip: offset,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                contentHash: true,
                manifestUri: true,
                creatorAddress: true,
                registryAddress: true,
                txHash: true,
                createdAt: true,
                bindings: {
                  select: {
                    platform: true,
                    platformId: true,
                  },
                },
              },
            }),
            prisma.content.count({ where }),
          ]);

          return { items, total };
        },
        { ttl: DEFAULT_TTL.CONTENT_METADATA }
      );

      return res.json({
        data: result.items,
        pagination: {
          limit,
          offset,
          total: result.total,
          hasMore: offset + limit < result.total,
        },
      });
    } catch (e: any) {
      return res.status(500).json({
        error: "Failed to fetch content",
        message: e?.message || String(e),
      });
    }
  }
);

/**
 * GET /api/v1/content/:id
 * Get specific content by ID
 */
router.get(
  "/:id",
  optionalAuthentication,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const cacheKey = `content:${id}`;
      const content = await cacheService.getOrSet(
        cacheKey,
        async () => {
          return await prisma.content.findUnique({
            where: { id },
            include: {
              bindings: {
                select: {
                  platform: true,
                  platformId: true,
                  createdAt: true,
                },
              },
              verifications: {
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                  status: true,
                  recoveredAddress: true,
                  createdAt: true,
                },
              },
            },
          });
        },
        { ttl: DEFAULT_TTL.CONTENT_METADATA }
      );

      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      return res.json({ data: content });
    } catch (e: any) {
      return res.status(500).json({
        error: "Failed to fetch content",
        message: e?.message || String(e),
      });
    }
  }
);

/**
 * GET /api/v1/content/hash/:hash
 * Get content by content hash
 */
router.get(
  "/hash/:hash",
  optionalAuthentication,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { hash } = req.params;

      const cacheKey = `content:hash:${hash}`;
      const content = await cacheService.getOrSet(
        cacheKey,
        async () => {
          return await prisma.content.findUnique({
            where: { contentHash: hash },
            include: {
              bindings: {
                select: {
                  platform: true,
                  platformId: true,
                  createdAt: true,
                },
              },
              verifications: {
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                  status: true,
                  recoveredAddress: true,
                  createdAt: true,
                },
              },
            },
          });
        },
        { ttl: DEFAULT_TTL.CONTENT_METADATA }
      );

      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      return res.json({ data: content });
    } catch (e: any) {
      return res.status(500).json({
        error: "Failed to fetch content",
        message: e?.message || String(e),
      });
    }
  }
);

export default router;
