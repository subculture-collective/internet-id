import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

function providerForPlatform(platform: string): string | null {
  const p = platform.toLowerCase();
  if (p === "youtube") return "google"; // via Google OAuth
  if (p === "x" || p === "twitter") return "twitter"; // requires adding twitter provider
  if (p === "github") return "github";
  if (p === "google") return "google";
  // Add more as providers get configured (instagram, tiktok, etc.)
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session as any).user.id as string;
  const body = await req.json();
  const { registryAddress, platform, platformId, contentHash } = body || {};
  if (!registryAddress || !platform || !platformId || !contentHash) {
    return NextResponse.json(
      { error: "registryAddress, platform, platformId, contentHash required" },
      { status: 400 }
    );
  }
  const requiredProvider = providerForPlatform(String(platform));
  if (requiredProvider) {
    const acct = await prisma.account.findFirst({
      where: { userId, provider: requiredProvider },
      select: { id: true },
    });
    if (!acct) {
      return NextResponse.json(
        {
          error: `Link your ${requiredProvider} account before binding ${platform}.`,
          missingProvider: requiredProvider,
        },
        { status: 403 }
      );
    }
  }
  // Proxy to the Express API
  const res = await fetch(`${API_BASE}/api/bind`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    },
    body: JSON.stringify({
      registryAddress,
      platform,
      platformId,
      contentHash,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }
  const json = await res.json();
  return NextResponse.json(json);
}
