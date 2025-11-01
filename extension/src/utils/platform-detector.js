/**
 * Platform Detection Utilities
 * Detects current platform and extracts relevant IDs
 */

/**
 * Supported platforms
 */
const PLATFORMS = {
  YOUTUBE: "youtube",
  TWITTER: "twitter",
  INSTAGRAM: "instagram",
  GITHUB: "github",
  TIKTOK: "tiktok",
  LINKEDIN: "linkedin",
  UNKNOWN: "unknown",
};

/**
 * Detect current platform from URL
 * @param {string} url - Current page URL
 * @returns {string} Platform identifier
 */
function detectPlatform(url) {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes("youtube.com")) {
    return PLATFORMS.YOUTUBE;
  } else if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    return PLATFORMS.TWITTER;
  } else if (hostname.includes("instagram.com")) {
    return PLATFORMS.INSTAGRAM;
  } else if (hostname.includes("github.com")) {
    return PLATFORMS.GITHUB;
  } else if (hostname.includes("tiktok.com")) {
    return PLATFORMS.TIKTOK;
  } else if (hostname.includes("linkedin.com")) {
    return PLATFORMS.LINKEDIN;
  }

  return PLATFORMS.UNKNOWN;
}

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract Twitter/X post ID from URL
 * @param {string} url - Twitter/X URL
 * @returns {string|null} Post ID or null
 */
function extractTwitterId(url) {
  const pattern = /(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/;
  const match = url.match(pattern);
  return match ? match[2] : null;
}

/**
 * Extract Instagram post ID from URL
 * @param {string} url - Instagram URL
 * @returns {string|null} Post ID or null
 */
function extractInstagramId(url) {
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract GitHub repository or file path
 * @param {string} url - GitHub URL
 * @returns {object|null} Repository info or null
 */
function extractGitHubId(url) {
  const pattern = /github\.com\/([^\/]+)\/([^\/]+)(?:\/(.*))?/;
  const match = url.match(pattern);

  if (match) {
    return {
      owner: match[1],
      repo: match[2],
      path: match[3] || "",
    };
  }

  return null;
}

/**
 * Extract TikTok video ID from URL
 * @param {string} url - TikTok URL
 * @returns {string|null} Video ID or null
 */
function extractTikTokId(url) {
  const pattern = /tiktok\.com\/@[^\/]+\/video\/(\d+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Extract LinkedIn post ID from URL
 * @param {string} url - LinkedIn URL
 * @returns {string|null} Post ID or null
 */
function extractLinkedInId(url) {
  const pattern = /linkedin\.com\/posts\/[^\/]+\/([^\/\?]+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Extract platform-specific ID from URL
 * @param {string} url - Current page URL
 * @returns {object} Platform and ID info
 */
function extractPlatformId(url) {
  const platform = detectPlatform(url);
  let platformId = null;
  let additionalInfo = null;

  switch (platform) {
    case PLATFORMS.YOUTUBE:
      platformId = extractYouTubeId(url);
      break;
    case PLATFORMS.TWITTER:
      platformId = extractTwitterId(url);
      break;
    case PLATFORMS.INSTAGRAM:
      platformId = extractInstagramId(url);
      break;
    case PLATFORMS.GITHUB:
      additionalInfo = extractGitHubId(url);
      platformId = additionalInfo ? `${additionalInfo.owner}/${additionalInfo.repo}` : null;
      break;
    case PLATFORMS.TIKTOK:
      platformId = extractTikTokId(url);
      break;
    case PLATFORMS.LINKEDIN:
      platformId = extractLinkedInId(url);
      break;
  }

  return {
    platform,
    platformId,
    additionalInfo,
    url,
  };
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    PLATFORMS,
    detectPlatform,
    extractPlatformId,
    extractYouTubeId,
    extractTwitterId,
    extractInstagramId,
    extractGitHubId,
    extractTikTokId,
    extractLinkedInId,
  };
}
