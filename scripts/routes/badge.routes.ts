/**
 * Badge Routes
 *
 * API endpoints for badge generation, embed code generation, and badge customization.
 */

import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { validateParams } from "../validation/middleware";
import { contentHashParamSchema } from "../validation/schemas";
import { cacheService, DEFAULT_TTL } from "../services/cache.service";
import { badgeService, BadgeData } from "../services/badge.service";

const router = Router();

/**
 * GET /api/badge/:hash/svg
 * Generate SVG badge for a content hash
 */
router.get(
  "/badge/:hash/svg",
  validateParams(contentHashParamSchema),
  async (req: Request, res: Response) => {
    try {
      const hash = req.params.hash;

      // Parse query options
      const options = badgeService.validateBadgeOptions({
        theme: req.query.theme,
        size: req.query.size || req.query.w || req.query.width,
        style: req.query.style,
        showTimestamp: req.query.showTimestamp || req.query.timestamp,
        showPlatform: req.query.showPlatform || req.query.platform,
      });

      // Create cache key based on hash and options
      const cacheKey = `badge:svg:${hash}:${JSON.stringify(options)}`;

      // Try to get from cache
      let svg = await cacheService.get(cacheKey);

      if (!svg) {
        // Fetch content data from database (gracefully handle errors)
        let content = null;
        try {
          content = await prisma.content.findUnique({
            where: { contentHash: hash },
            include: { bindings: true },
          });
        } catch (dbError) {
          // Database unavailable - continue with unverified badge
          console.warn("Database query failed, generating unverified badge:", dbError);
        }

        // Prepare badge data
        const badgeData: BadgeData = {
          contentHash: hash,
          verified: !!content,
          timestamp: content?.createdAt,
          platform: content?.bindings?.[0]?.platform,
          creator: content?.creatorAddress,
        };

        // Override platform if specified in query
        if (req.query.platform && typeof req.query.platform === "string") {
          badgeData.platform = req.query.platform;
        }

        // Generate SVG
        svg = badgeService.generateBadgeSVG(badgeData, options);

        // Cache the result
        await cacheService.set(cacheKey, svg, { ttl: DEFAULT_TTL.CONTENT_METADATA });
      }

      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(svg);
    } catch (e: any) {
      console.error("Badge generation error:", e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

/**
 * GET /api/badge/:hash/png
 * Generate PNG badge (redirects to SVG for now, could use conversion library)
 */
router.get(
  "/badge/:hash/png",
  validateParams(contentHashParamSchema),
  async (req: Request, res: Response) => {
    try {
      // For now, redirect to SVG
      // TODO: Implement actual PNG conversion if needed
      const hash = req.params.hash;
      const queryString = new URLSearchParams(req.query as any).toString();
      const svgUrl = `/api/badge/${hash}/svg${queryString ? "?" + queryString : ""}`;

      res.redirect(svgUrl);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

/**
 * GET /api/badge/:hash/embed
 * Get embed codes (HTML and Markdown) for a badge
 */
router.get(
  "/badge/:hash/embed",
  validateParams(contentHashParamSchema),
  async (req: Request, res: Response) => {
    try {
      const hash = req.params.hash;

      // Parse options for badge URL
      const options = badgeService.validateBadgeOptions({
        theme: req.query.theme,
        size: req.query.size,
        style: req.query.style,
      });

      // Build badge URL with query params
      const queryParams = new URLSearchParams();
      if (options.theme) queryParams.set("theme", options.theme);
      if (options.size) queryParams.set("size", String(options.size));
      if (options.style) queryParams.set("style", options.style);

      const queryString = queryParams.toString();

      // Get base URL from environment or construct from request
      const siteBase =
        process.env.NEXT_PUBLIC_SITE_BASE ||
        process.env.API_BASE_URL ||
        `${req.protocol}://${req.get("host")}`;

      const badgeUrl = `${siteBase}/api/badge/${hash}/svg${queryString ? "?" + queryString : ""}`;
      const verifyUrl = `${siteBase}/verify?hash=${hash}`;

      // Generate embed snippets
      const snippets = badgeService.generateEmbedSnippets(badgeUrl, verifyUrl, hash);

      res.json(snippets);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

/**
 * GET /api/badge/options
 * Get available badge customization options
 */
router.get("/badge/options", async (_req: Request, res: Response) => {
  try {
    const options = {
      themes: ["dark", "light", "blue", "green", "purple"],
      sizes: ["small", "medium", "large", "custom (120-640)"],
      styles: ["flat", "rounded", "pill", "minimal"],
      customization: {
        showTimestamp: "boolean",
        showPlatform: "boolean",
        platform: "string (platform name)",
      },
      examples: [
        "/api/badge/{hash}/svg?theme=dark&size=medium&style=rounded",
        "/api/badge/{hash}/svg?theme=light&size=large&style=pill",
        "/api/badge/{hash}/svg?theme=blue&size=small&style=flat&showTimestamp=true",
      ],
    };

    res.json(options);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

/**
 * GET /api/badge/:hash/status
 * Get verification status for a content hash (without generating badge)
 */
router.get(
  "/badge/:hash/status",
  validateParams(contentHashParamSchema),
  async (req: Request, res: Response) => {
    try {
      const hash = req.params.hash;

      // Check cache first
      const cacheKey = `badge:status:${hash}`;
      let status = await cacheService.get(cacheKey);

      if (!status) {
        // Fetch content data (gracefully handle errors)
        let content = null;
        try {
          content = await prisma.content.findUnique({
            where: { contentHash: hash },
            include: { bindings: true },
          });
        } catch (dbError) {
          // Database unavailable - return unverified status
          console.warn("Database query failed for status check:", dbError);
        }

        status = {
          contentHash: hash,
          verified: !!content,
          timestamp: content?.createdAt?.toISOString(),
          platforms: content?.bindings?.map((b) => b.platform) || [],
          creator: content?.creatorAddress,
          registryAddress: content?.registryAddress,
        };

        // Cache with shorter TTL for status checks
        await cacheService.set(cacheKey, JSON.stringify(status), {
          ttl: DEFAULT_TTL.VERIFICATION_STATUS,
        });
      } else {
        status = JSON.parse(status);
      }

      res.json(status);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
