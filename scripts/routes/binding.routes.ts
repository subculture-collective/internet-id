import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import { requireApiKey } from "../middleware/auth.middleware";
import { prisma } from "../db";
import { validateBody } from "../validation/middleware";
import { bindRequestSchema, bindManyRequestSchema } from "../validation/schemas";

const router = Router();

// Bind platform and upsert DB binding
router.post(
  "/bind",
  requireApiKey as any,
  validateBody(bindRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { registryAddress, platform, platformId, contentHash } = req.body as {
        registryAddress: string;
        platform: string;
        platformId: string;
        contentHash: string;
      };
      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );
      const pk = process.env.PRIVATE_KEY;
      if (!pk) return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
      const wallet = new ethers.Wallet(pk, provider);
      const abi = [
        "function bindPlatform(bytes32,string,string) external",
        "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      ];
      const registry = new ethers.Contract(registryAddress, abi, wallet);
      // Ensure caller is creator
      const entry = await registry.entries(contentHash);
      if ((entry?.creator || "").toLowerCase() !== (await wallet.getAddress()).toLowerCase()) {
        return res.status(403).json({ error: "Only creator can bind platform" });
      }
      const tx = await registry.bindPlatform(contentHash, platform, platformId);
      const receipt = await tx.wait();
      // upsert binding in DB
      try {
        const content = await prisma.content.findUnique({
          where: { contentHash },
        });
        await prisma.platformBinding.upsert({
          where: { platform_platformId: { platform, platformId } },
          create: { platform, platformId, contentId: content?.id },
          update: { contentId: content?.id },
        });
      } catch (e) {
        console.warn("DB upsert platform binding failed:", e);
      }
      res.json({ txHash: receipt?.hash });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

// Bind multiple platforms in one request (sequential txs)
router.post(
  "/bind-many",
  requireApiKey as any,
  validateBody(bindManyRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { registryAddress, contentHash, bindings } = req.body as {
        registryAddress: string;
        contentHash: string;
        bindings: Array<{ platform: string; platformId: string }>;
      };
      const provider = new ethers.JsonRpcProvider(
        process.env.RPC_URL || "https://sepolia.base.org"
      );
      const pk = process.env.PRIVATE_KEY;
      if (!pk) return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
      const wallet = new ethers.Wallet(pk, provider);
      const abi = [
        "function bindPlatform(bytes32,string,string) external",
        "function entries(bytes32) view returns (address creator, bytes32 contentHash, string manifestURI, uint64 timestamp)",
      ];
      const registry = new ethers.Contract(registryAddress, abi, wallet);
      // Ensure caller is creator
      const entry = await registry.entries(contentHash);
      if ((entry?.creator || "").toLowerCase() !== (await wallet.getAddress()).toLowerCase()) {
        return res.status(403).json({ error: "Only creator can bind platform" });
      }
      const results: Array<{
        platform: string;
        platformId: string;
        txHash?: string;
        error?: string;
      }> = [];
      for (const b of bindings) {
        const platform = (b?.platform || "").toString();
        const platformId = (b?.platformId || "").toString();
        if (!platform || !platformId) {
          results.push({ platform, platformId, error: "invalid binding" });
          continue;
        }
        try {
          const tx = await registry.bindPlatform(contentHash, platform, platformId);
          const rec = await tx.wait();
          results.push({ platform, platformId, txHash: rec?.hash });
          // upsert DB binding
          try {
            const content = await prisma.content.findUnique({
              where: { contentHash },
            });
            await prisma.platformBinding.upsert({
              where: { platform_platformId: { platform, platformId } },
              create: { platform, platformId, contentId: content?.id },
              update: { contentId: content?.id },
            });
          } catch (e) {
            console.warn("DB upsert platform binding (bind-many) failed:", e);
          }
        } catch (e: any) {
          results.push({
            platform,
            platformId,
            error: e?.message || String(e),
          });
        }
      }
      res.json({ results });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
