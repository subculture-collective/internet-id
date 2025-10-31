import { Router, Response } from "express";
import { authenticateRequest, AuthenticatedRequest } from "../../middleware/api-auth.middleware";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
} from "../../services/api-key.service";

const router = Router();

/**
 * POST /api/v1/api-keys
 * Create a new API key for the authenticated user
 * Body: { name?: string, tier?: string, expiresAt?: string }
 */
router.post("/", authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, tier, expiresAt } = req.body;
    const userId = req.auth!.userId;

    const expiryDate = expiresAt ? new Date(expiresAt) : undefined;

    const apiKey = await createApiKey(userId, name, tier, expiryDate);

    return res.status(201).json({
      message: "API key created successfully",
      data: apiKey,
      warning: "Save this key securely. It won't be shown again.",
    });
  } catch (e: any) {
    return res.status(500).json({
      error: "Failed to create API key",
      message: e?.message || String(e),
    });
  }
});

/**
 * GET /api/v1/api-keys
 * List all API keys for the authenticated user
 */
router.get("/", authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth!.userId;
    const keys = await listApiKeys(userId);

    return res.json({
      data: keys,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: "Failed to list API keys",
      message: e?.message || String(e),
    });
  }
});

/**
 * PATCH /api/v1/api-keys/:id/revoke
 * Revoke an API key
 */
router.patch(
  "/:id/revoke",
  authenticateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.auth!.userId;

      await revokeApiKey(id, userId);

      return res.json({
        message: "API key revoked successfully",
      });
    } catch (e: any) {
      return res.status(500).json({
        error: "Failed to revoke API key",
        message: e?.message || String(e),
      });
    }
  }
);

/**
 * DELETE /api/v1/api-keys/:id
 * Delete an API key
 */
router.delete("/:id", authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.auth!.userId;

    await deleteApiKey(id, userId);

    return res.json({
      message: "API key deleted successfully",
    });
  } catch (e: any) {
    return res.status(500).json({
      error: "Failed to delete API key",
      message: e?.message || String(e),
    });
  }
});

export default router;
