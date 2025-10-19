import { Router, Request, Response } from "express";
import { prisma } from "../db";

const router = Router();

// Users API (minimal)
router.post("/users", async (req: Request, res: Response) => {
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

// Content detail by contentHash
router.get("/contents/:hash", async (req: Request, res: Response) => {
  try {
    const hash = req.params.hash;
    if (!hash) return res.status(400).json({ error: "hash is required" });
    const item = await prisma.content.findUnique({
      where: { contentHash: hash },
      include: { bindings: true },
    });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Verifications listing
router.get("/verifications", async (req: Request, res: Response) => {
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
});

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

// Verifications by contentHash
router.get(
  "/contents/:hash/verifications",
  async (req: Request, res: Response) => {
    try {
      const hash = req.params.hash;
      const items = await prisma.verification.findMany({
        where: { contentHash: hash },
        orderBy: { createdAt: "desc" },
      });
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
