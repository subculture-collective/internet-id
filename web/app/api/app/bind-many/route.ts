import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

function providerForPlatform(platform: string): string | null {
  const p = platform.toLowerCase();
  if (p === "youtube") return "google";
  if (p === "x" || p === "twitter") return "twitter";
  if (p === "github") return "github";
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session as any).user.id as string;
  const body = await req.json();
  const { registryAddress, contentHash, bindings } = body || {};
  if (!registryAddress || !contentHash || !bindings) {
    return NextResponse.json(
      { error: "registryAddress, contentHash, bindings required" },
      { status: 400 }
    );
  }
  let arr: Array<{ platform: string; platformId: string }> = [];
  try {
    if (typeof bindings === "string") arr = JSON.parse(bindings);
    else if (Array.isArray(bindings)) arr = bindings;
  } catch {}
  if (!Array.isArray(arr) || arr.length === 0) {
    return NextResponse.json({ error: "bindings must be an array" }, { status: 400 });
  }
  // Enforce linked provider presence
  const providersNeeded = new Set<string>();
  for (const b of arr) {
    const reqProv = providerForPlatform(String(b.platform));
    if (reqProv) providersNeeded.add(reqProv);
  }
  for (const prov of providersNeeded) {
    const acct = await prisma.account.findFirst({
      where: { userId, provider: prov },
      select: { id: true },
    });
    if (!acct) {
      return NextResponse.json(
        {
          error: `Link your ${prov} account before binding.`,
          missingProvider: prov,
        },
        { status: 403 }
      );
    }
  }

  // Proxy to Express API
  const res = await fetch(`${API_BASE}/api/bind-many`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    },
    body: JSON.stringify({ registryAddress, contentHash, bindings }),
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }
  const json = await res.json();
  return NextResponse.json(json);
}
