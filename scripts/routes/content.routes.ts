import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { validateBody, validateQuery, validateParams } from "../validation/middleware";
import {
  createUserSchema,
  verificationsQuerySchema,
  contentHashParamSchema,
} from "../validation/schemas";
import { cacheService, getCachedContent, cacheContent, DEFAULT_TTL } from "../services/cache.service";

const router = Router();

// Users API (minimal)
router.post("/users", validateBody(createUserSchema), async (req: Request, res: Response) => {
  try {
    const { address, email, name } = req.body as {
      address?: string;
      email?: string;
      name?: string;
    };
    const user = await prisma.user.create({
      data: {
        address: address || undefined,
        email: email || undefined,
        name: name || undefined,
      },
    });
    res.json(user);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

router.get("/contents", async (_req: Request, res: Response) => {
  try {
    const items = await prisma.content.findMany({
      orderBy: { createdAt: "desc" },
      include: { bindings: true },
    });
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Content detail by contentHash - with caching
router.get(
  "/contents/:hash",
  validateParams(contentHashParamSchema),
  async (req: Request, res: Response) => {
    try {
      const hash = req.params.hash;
      
      // Use cache-aside pattern
      const item = await cacheService.getOrSet(
        `content:${hash}`,
        async () => {
          return await prisma.content.findUnique({
            where: { contentHash: hash },
            include: { bindings: true },
          });
        },
        { ttl: DEFAULT_TTL.CONTENT_METADATA }
      );
      
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

// Verifications listing
router.get(
  "/verifications",
  validateQuery(verificationsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { contentHash, limit } = req.query as {
        contentHash?: string;
        limit?: string;
      };
      const take = Math.max(1, Math.min(100, Number(limit || 50)));
      const items = await prisma.verification.findMany({
        where: contentHash ? { contentHash } : undefined,
        orderBy: { createdAt: "desc" },
        take,
      });
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

// Verification detail
router.get("/verifications/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const v = await prisma.verification.findUnique({ where: { id } });
    if (!v) return res.status(404).json({ error: "Not found" });
    res.json(v);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Verifications by contentHash - with caching
router.get(
  "/contents/:hash/verifications",
  validateParams(contentHashParamSchema),
  async (req: Request, res: Response) => {
    try {
      const hash = req.params.hash;
      
      // Use cache-aside pattern with shorter TTL for verifications
      const items = await cacheService.getOrSet(
        `verifications:${hash}`,
        async () => {
          return await prisma.verification.findMany({
            where: { contentHash: hash },
            orderBy: { createdAt: "desc" },
          });
        },
        { ttl: DEFAULT_TTL.VERIFICATION_STATUS }
      );
      
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
