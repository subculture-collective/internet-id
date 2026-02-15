import { Router, Request, Response } from "express";
import { requireApiKey } from "../middleware/auth.middleware";
import { validateBody } from "../validation/middleware";
import { bindRequestSchema, bindManyRequestSchema } from "../validation/schemas";
import { createProviderAndWallet, createRegistryContract } from "../services/blockchain.service";
import { BIND_PLATFORM_ABI } from "../constants/abi";
import { upsertPlatformBinding } from "../services/content-db.service";

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
      
      try {
        const { provider, wallet } = createProviderAndWallet();
        const registry = createRegistryContract(registryAddress, BIND_PLATFORM_ABI, wallet);
        // Ensure caller is creator
        const entry = await registry.entries(contentHash);
        if ((entry?.creator || "").toLowerCase() !== (await wallet.getAddress()).toLowerCase()) {
          return res.status(403).json({ error: "Only creator can bind platform" });
        }
        const tx = await registry.bindPlatform(contentHash, platform, platformId);
        const receipt = await tx.wait();
        
        // upsert binding in DB
        await upsertPlatformBinding({ platform, platformId, contentHash });
        res.json({ txHash: receipt?.hash });
      } catch (e: any) {
        if (e?.message?.includes("PRIVATE_KEY missing")) {
          return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
        }
        throw e;
      }
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
      
      try {
        const { provider, wallet } = createProviderAndWallet();
        const registry = createRegistryContract(registryAddress, BIND_PLATFORM_ABI, wallet);
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
            await upsertPlatformBinding({ platform, platformId, contentHash });
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
        if (e?.message?.includes("PRIVATE_KEY missing")) {
          return res.status(400).json({ error: "PRIVATE_KEY missing in env" });
        }
        throw e;
      }
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
