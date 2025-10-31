import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const short = hash && hash.length > 20 ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : hash;
  const sp = req.nextUrl.searchParams;
  const theme = (sp.get("theme") || "dark").toLowerCase();
  const wStr = sp.get("w") || sp.get("width") || sp.get("size");
  const width = Math.max(120, Math.min(640, Number(wStr || 240) || 240));
  const scale = width / 240;
  const height = Math.round(32 * scale);
  const rx = Math.round(6 * scale);
  const xPad = Math.round(10 * scale);
  const yText = Math.round(21 * scale);
  const fontSize = 12 * scale;
  const bg = theme === "light" ? "#ffffff" : "#0b0f1a";
  const fg = theme === "light" ? "#0b0f1a" : "#9ef";
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="Verified on-chain: ${short}">
  <title>Verified on-chain: ${short}</title>
  <rect rx="${rx}" width="${width}" height="${height}" fill="${bg}"/>
  <text x="${xPad}" y="${yText}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fontSize}" fill="${fg}">Verified · ${short}</text>
</svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
