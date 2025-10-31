import { Router, Request, Response } from "express";
import { generateJwtToken } from "../../services/jwt.service";
import { prisma } from "../../db";
import { ethers } from "ethers";

const router = Router();

/**
 * POST /api/v1/auth/token
 * Generate a JWT token for user-scoped API access
 * Body: { address: string, signature: string, message: string }
 * 
 * This endpoint allows users to authenticate by signing a message with their wallet
 * and receive a JWT token for making authenticated API requests.
 */
router.post("/token", async (req: Request, res: Response) => {
  try {
    const { address, signature, message } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json({
        error: "Invalid request",
        message: "address, signature, and message are required",
      });
    }

    // Verify signature
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (e) {
      return res.status(401).json({
        error: "Invalid signature",
        message: "Failed to recover address from signature",
      });
    }

    // Check if recovered address matches claimed address
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Signature does not match address",
      });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { address: address.toLowerCase() },
      });
    }

    // Generate JWT token
    const token = generateJwtToken({
      userId: user.id,
      address: user.address || undefined,
      email: user.email || undefined,
      tier: "free", // Default tier, can be upgraded
    });

    return res.json({
      token,
      expiresIn: "24h",
      user: {
        id: user.id,
        address: user.address,
        email: user.email,
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      error: "Token generation failed",
      message: e?.message || String(e),
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh a JWT token (placeholder for future implementation)
 */
router.post("/refresh", async (req: Request, res: Response) => {
  return res.status(501).json({
    error: "Not implemented",
    message: "Token refresh will be implemented in a future version",
  });
});

export default router;
