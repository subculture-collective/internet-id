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
    // GitHub
    if (host.includes("github.com")) {
      const p = u.pathname.replace(/^\/+/, "").replace(/\/$/, "");
      return { platform: "github", platformId: p || input };
    }
    // Discord
    if (host.includes("discord.com") || host.includes("discord.gg")) {
      const p = u.pathname.replace(/^\/+/, "").replace(/\/$/, "");
      return { platform: "discord", platformId: p || input };
    }
    // LinkedIn
    if (host.includes("linkedin.com")) {
      const p = u.pathname.replace(/^\/+/, "").replace(/\/$/, "");
      return { platform: "linkedin", platformId: p || input };
    }
    // Fallback: generic
    return { platform: host.split(".")[0] || "generic", platformId: input };
  } catch {
    // Not a URL; accept raw as platformId
    return { platform: "generic", platformId: input };
  }
}

// Generic platform ID extraction helper
function extractPlatformIdFromUrl(
  input: string,
  hostnames: string[],
  pathTransform?: (pathname: string, hostname: string) => string
): string {
  try {
    const url = new URL(input);
    for (const hostname of hostnames) {
      if (url.hostname.includes(hostname)) {
        const pathname = url.pathname.replace(/^\/+/, "").replace(/\/$/, "");
        return pathTransform ? pathTransform(pathname, url.hostname) : pathname;
      }
    }
    return "";
  } catch {
    return input; // assume raw ID or path
  }
}

// Extract TikTok ID from URL or raw input
export function extractTikTokId(input: string): string {
  return extractPlatformIdFromUrl(input, ["tiktok.com"]);
}

// Extract Instagram ID from URL or raw input
export function extractInstagramId(input: string): string {
  return extractPlatformIdFromUrl(input, ["instagram.com"]);
}

// Extract GitHub ID from URL or raw input
export function extractGitHubId(input: string): string {
  return extractPlatformIdFromUrl(
    input,
    ["gist.github.com", "github.com"],
    (pathname, hostname) => {
      if (hostname.includes("gist.github.com")) {
        return `gist/${pathname}`;
      }
      return pathname;
    }
  );
}

// Extract Discord ID from URL or raw input
export function extractDiscordId(input: string): string {
  return extractPlatformIdFromUrl(input, ["discord.com", "discord.gg"]);
}

// Extract LinkedIn ID from URL or raw input
export function extractLinkedInId(input: string): string {
  return extractPlatformIdFromUrl(input, ["linkedin.com"]);
}
