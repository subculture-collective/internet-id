import { URL } from "url";

export interface PlatformInfo {
  platform: string;
  platformId: string;
}

// Parse platform input from a URL or explicit platform/platformId
export function parsePlatformInput(
  input?: string,
  platform?: string,
  platformId?: string
): PlatformInfo | null {
  if (platform && platformId) return { platform: platform.toLowerCase(), platformId };
  if (!input) return null;
  try {
    const u = new URL(input);
    const host = u.hostname.replace(/^www\./, "");
    // YouTube
    if (host.includes("youtube.com") || host === "youtu.be") {
      const id =
        u.searchParams.get("v") ||
        (host === "youtu.be"
          ? u.pathname.replace(/^\//, "")
          : u.pathname.split("/").filter(Boolean).pop() || "");
      return { platform: "youtube", platformId: id || input };
    }
    // TikTok
    if (host.includes("tiktok.com")) {
      const p = u.pathname.replace(/^\/+/, "").replace(/\/$/, "");
      return { platform: "tiktok", platformId: p || input };
    }
    // X/Twitter
    if (host.includes("x.com") || host.includes("twitter.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const statusIdx = parts.findIndex((p) => p === "status");
      if (statusIdx >= 0 && parts[statusIdx + 1])
        return { platform: "x", platformId: parts[statusIdx + 1] };
      return { platform: "x", platformId: parts.join("/") || input };
    }
    // Instagram
    if (host.includes("instagram.com")) {
      return {
        platform: "instagram",
        platformId: u.pathname.replace(/^\/+/, "").replace(/\/$/, ""),
      };
    }
    // Vimeo
    if (host.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop() || "";
      return { platform: "vimeo", platformId: id || input };
    }
    // Fallback: generic
    return { platform: host.split(".")[0] || "generic", platformId: input };
  } catch {
    // Not a URL; accept raw as platformId
    return { platform: "generic", platformId: input };
  }
}
