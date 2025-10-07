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
  const fd = await req.formData();
  // Extract bindings or platform+platformId to enforce ownership
  let bindingsArr: Array<{ platform: string; platformId: string }> = [];
  const bindingsRaw = fd.get("bindings");
  if (typeof bindingsRaw === "string") {
    try {
      const arr = JSON.parse(bindingsRaw);
      if (Array.isArray(arr)) {
        bindingsArr = arr
          .filter((b: any) => b && b.platform && b.platformId)
          .map((b: any) => ({
            platform: String(b.platform),
            platformId: String(b.platformId),
          }));
      }
    } catch {}
  }
  const platform = fd.get("platform");
  const platformId = fd.get("platformId");
  if (
    bindingsArr.length === 0 &&
    typeof platform === "string" &&
    typeof platformId === "string" &&
    platform &&
    platformId
  ) {
    bindingsArr = [{ platform, platformId }];
  }
  // Compute which providers are required and ensure user has linked them
  const providersNeeded = new Set<string>();
  for (const b of bindingsArr) {
    const prov = providerForPlatform(b.platform);
    if (prov) providersNeeded.add(prov);
  }
  for (const prov of providersNeeded) {
    const acct = await prisma.account.findFirst({
      where: { userId, provider: prov },
      select: { id: true },
    });
    if (!acct) {
      return NextResponse.json(
        {
          error: `Link your ${prov} account before running one-shot with bindings.`,
          missingProvider: prov,
        },
        { status: 403 }
      );
    }
  }
  // Forward multipart to backend API
  const out = new FormData();
  for (const [key, value] of fd.entries()) {
    // value can be string or File; append as-is
    if (typeof value === "string") out.append(key, value);
    else out.append(key, value, (value as File).name);
  }
  const res = await fetch(`${API_BASE}/api/one-shot`, {
    method: "POST",
    headers: {
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    } as any,
    body: out,
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }
  const json = await res.json();
  return NextResponse.json(json);
}
