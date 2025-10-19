import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import { readFile } from "fs/promises";
import * as path from "path";
import { resolveDefaultRegistry, resolveByPlatform } from "../services/registry.service";
import { parsePlatformInput } from "../services/platform.service";
import { fetchManifest } from "../services/manifest.service";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Network info (for UI explorer links)
router.get("/network", async (_req: Request, res: Response) => {
  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "https://sepolia.base.org"
    );
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
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "https://sepolia.base.org"
    );
    const net = await provider.getNetwork();
    const chainId = Number(net.chainId);
    if (override) return res.json({ registryAddress: override, chainId });

    // Attempt to map chainId to a deployed file in ./deployed
    let deployedFile: string | undefined;
    if (chainId === 84532)
      deployedFile = path.join(process.cwd(), "deployed", "baseSepolia.json");
    // Add more mappings here if other networks are deployed

    if (deployedFile) {
      try {
        const data = JSON.parse(
          (await readFile(deployedFile)).toString("utf8")
        );
        if (data?.address)
          return res.json({ registryAddress: data.address, chainId });
      } catch (e) {
        // fallthrough
      }
    }
    return res
      .status(404)
      .json({ error: "Registry address not configured", chainId });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Resolve binding by URL or platform+platformId
router.get("/resolve", async (req: Request, res: Response) => {
  try {
    const url = (req.query as any).url as string | undefined;
    const platform = (req.query as any).platform as string | undefined;
    const platformId = (req.query as any).platformId as string | undefined;
    const parsed = parsePlatformInput(url, platform, platformId);
    if (!parsed?.platform || !parsed.platformId) {
      return res
        .status(400)
        .json({ error: "Provide url or platform + platformId" });
    }
    const { registryAddress, chainId } = await resolveDefaultRegistry();
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "https://sepolia.base.org"
    );
    const entry = await resolveByPlatform(
      registryAddress,
      parsed.platform,
      parsed.platformId,
      provider
    );
    if (entry.creator === ethers.ZeroAddress)
      return res
        .status(404)
        .json({
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

// Public verify: resolve + include manifest JSON if on IPFS/HTTP
router.get("/public-verify", async (req: Request, res: Response) => {
  try {
    const url = (req.query as any).url as string | undefined;
    const platform = (req.query as any).platform as string | undefined;
    const platformId = (req.query as any).platformId as string | undefined;
    const parsed = parsePlatformInput(url, platform, platformId);
    if (!parsed?.platform || !parsed.platformId) {
      return res
        .status(400)
        .json({ error: "Provide url or platform + platformId" });
    }
    const { registryAddress, chainId } = await resolveDefaultRegistry();
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "https://sepolia.base.org"
    );
    const entry = await resolveByPlatform(
      registryAddress,
      parsed.platform,
      parsed.platformId,
      provider
    );
    if (entry.creator === ethers.ZeroAddress)
      return res
        .status(404)
        .json({
          error: "No binding found",
          ...parsed,
          registryAddress,
          chainId,
        });
    // Fetch manifest for convenience
    let manifest: any = null;
    try {
      manifest = await fetchManifest(entry.manifestURI);
    } catch {}
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
});

export default router;
