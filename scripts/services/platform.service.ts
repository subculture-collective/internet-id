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

// Extract TikTok ID from URL or raw input
export function extractTikTokId(input: string): string {
  try {
    const url = new URL(input);
    if (url.hostname.includes("tiktok.com")) {
      // Extract from pathname: /@username/video/1234567890 or /video/1234567890
      const pathname = url.pathname.replace(/^\/+/, "").replace(/\/$/, "");
      return pathname;
    }
    return "";
  } catch {
    return input; // assume raw ID or path
  }
}

// Extract Instagram ID from URL or raw input
export function extractInstagramId(input: string): string {
  try {
    const url = new URL(input);
    if (url.hostname.includes("instagram.com")) {
      // Extract from pathname: /p/ABC123 or /reel/ABC123 or username
      const pathname = url.pathname.replace(/^\/+/, "").replace(/\/$/, "");
      return pathname;
    }
    return "";
  } catch {
    return input; // assume raw ID or path
  }
}

// Extract GitHub ID from URL or raw input
export function extractGitHubId(input: string): string {
  try {
    const url = new URL(input);
    if (url.hostname.includes("gist.github.com")) {
      const pathname = url.pathname.replace(/^\/+/, "").replace(/\/$/, "");
      return `gist/${pathname}`;
    }
    if (url.hostname.includes("github.com")) {
      // Extract from pathname: /user/repo or /user/repo/blob/main/file.txt
      const pathname = url.pathname.replace(/^\/+/, "").replace(/\/$/, "");
      return pathname;
    }
    return "";
  } catch {
    return input; // assume raw ID or path
  }
}

// Extract Discord ID from URL or raw input
export function extractDiscordId(input: string): string {
  try {
    const url = new URL(input);
    if (url.hostname.includes("discord.com") || url.hostname.includes("discord.gg")) {
      // Extract invite code or server/channel IDs
      const pathname = url.pathname.replace(/^\/+/, "").replace(/\/$/, "");
      return pathname || url.hostname.replace("discord.gg", "invite");
    }
    return "";
  } catch {
    return input; // assume raw ID
  }
}

// Extract LinkedIn ID from URL or raw input
export function extractLinkedInId(input: string): string {
  try {
    const url = new URL(input);
    if (url.hostname.includes("linkedin.com")) {
      // Extract from pathname: /in/username or /posts/activity-id
      const pathname = url.pathname.replace(/^\/+/, "").replace(/\/$/, "");
      return pathname;
    }
    return "";
  } catch {
    return input; // assume raw ID or path
  }
}
