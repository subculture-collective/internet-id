/**
 * Badge Service
 *
 * Generates embeddable verification badges with different styles, themes, and configurations.
 * Supports SVG generation with caching and customization options.
 */

export interface BadgeOptions {
  theme?: "dark" | "light" | "blue" | "green" | "purple";
  size?: "small" | "medium" | "large" | number;
  style?: "flat" | "rounded" | "pill" | "minimal";
  showTimestamp?: boolean;
  showPlatform?: boolean;
  platform?: string;
}

export interface BadgeData {
  contentHash: string;
  verified: boolean;
  timestamp?: Date;
  platform?: string;
  creator?: string;
}

const THEME_COLORS = {
  dark: { bg: "#0b0f1a", fg: "#9ef", accent: "#0cf" },
  light: { bg: "#ffffff", fg: "#0b0f1a", accent: "#0080ff" },
  blue: { bg: "#1a237e", fg: "#e3f2fd", accent: "#64b5f6" },
  green: { bg: "#1b5e20", fg: "#e8f5e9", accent: "#81c784" },
  purple: { bg: "#4a148c", fg: "#f3e5f5", accent: "#ba68c8" },
};

const SIZE_PRESETS = {
  small: 180,
  medium: 240,
  large: 320,
};

/**
 * Generate an SVG badge for verified content
 */
export function generateBadgeSVG(data: BadgeData, options: BadgeOptions = {}): string {
  const {
    theme = "dark",
    size = "medium",
    style = "rounded",
    showTimestamp = false,
    showPlatform = false,
  } = options;

  // Resolve size
  const width = typeof size === "number" ? size : SIZE_PRESETS[size];
  const colors = THEME_COLORS[theme];

  // Calculate dimensions
  const scale = width / 240;
  const height = Math.round(32 * scale);
  const rx = style === "pill" ? height / 2 : style === "rounded" ? Math.round(6 * scale) : 0;
  const xPad = Math.round(10 * scale);
  const yText = Math.round(21 * scale);
  const fontSize = 12 * scale;

  // Truncate hash for display
  const shortHash =
    data.contentHash && data.contentHash.length > 20
      ? `${data.contentHash.slice(0, 10)}…${data.contentHash.slice(-6)}`
      : data.contentHash;

  // Status indicator
  const statusIcon = data.verified ? "✓" : "✗";
  const statusText = data.verified ? "Verified" : "Unverified";

  // Build badge text
  let badgeText = `${statusIcon} ${statusText}`;

  if (showPlatform && data.platform) {
    badgeText += ` · ${data.platform}`;
  }

  if (style === "minimal") {
    badgeText = statusIcon;
  } else if (data.contentHash && style !== "pill") {
    badgeText += ` · ${shortHash}`;
  }

  // Add timestamp if requested
  let timestampText = "";
  if (showTimestamp && data.timestamp) {
    const dateStr = data.timestamp.toISOString().split("T")[0];
    timestampText = `<text x="${xPad}" y="${yText + fontSize + 4}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fontSize * 0.8}" fill="${colors.fg}" opacity="0.7">${dateStr}</text>`;
  }

  const finalHeight = showTimestamp ? height + Math.round(14 * scale) : height;

  // Generate SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${finalHeight}" role="img" aria-label="${statusText}: ${shortHash}">
  <title>${statusText} on-chain: ${shortHash}</title>
  <rect rx="${rx}" width="${width}" height="${finalHeight}" fill="${colors.bg}" stroke="${colors.accent}" stroke-width="${Math.max(1, scale * 0.5)}"/>
  <text x="${xPad}" y="${yText}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fontSize}" fill="${colors.fg}" font-weight="500">${badgeText}</text>
  ${timestampText}
</svg>`;

  return svg;
}

/**
 * Generate HTML embed code for a badge
 */
export function generateEmbedHTML(
  badgeUrl: string,
  targetUrl: string,
  options: { alt?: string; title?: string } = {}
): string {
  const alt = options.alt || "Verified on Internet ID";
  const title = options.title || "View verification details";

  return `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer" title="${title}">
  <img src="${badgeUrl}" alt="${alt}" />
</a>`;
}

/**
 * Generate Markdown embed code for a badge
 */
export function generateEmbedMarkdown(
  badgeUrl: string,
  targetUrl: string,
  options: { alt?: string } = {}
): string {
  const alt = options.alt || "Verified on Internet ID";
  return `[![${alt}](${badgeUrl})](${targetUrl})`;
}

/**
 * Generate a complete embed snippet package
 */
export function generateEmbedSnippets(badgeUrl: string, verifyUrl: string, contentHash: string) {
  return {
    html: generateEmbedHTML(badgeUrl, verifyUrl, { alt: `Verified content ${contentHash}` }),
    markdown: generateEmbedMarkdown(badgeUrl, verifyUrl, {
      alt: `Verified content ${contentHash}`,
    }),
    direct: badgeUrl,
    verify: verifyUrl,
    contentHash,
  };
}

/**
 * Validate badge options
 */
export function validateBadgeOptions(options: any): BadgeOptions {
  const validated: BadgeOptions = {};

  if (options.theme && ["dark", "light", "blue", "green", "purple"].includes(options.theme)) {
    validated.theme = options.theme;
  }

  if (options.size) {
    if (["small", "medium", "large"].includes(options.size)) {
      validated.size = options.size;
    } else {
      const numSize = Number(options.size);
      if (!isNaN(numSize) && numSize >= 120 && numSize <= 640) {
        validated.size = Math.round(numSize);
      }
    }
  }

  if (options.style && ["flat", "rounded", "pill", "minimal"].includes(options.style)) {
    validated.style = options.style;
  }

  validated.showTimestamp = options.showTimestamp === "true" || options.showTimestamp === true;
  validated.showPlatform = options.showPlatform === "true" || options.showPlatform === true;

  if (options.platform && typeof options.platform === "string") {
    validated.platform = options.platform;
  }

  return validated;
}

export const badgeService = {
  generateBadgeSVG,
  generateEmbedHTML,
  generateEmbedMarkdown,
  generateEmbedSnippets,
  validateBadgeOptions,
};
