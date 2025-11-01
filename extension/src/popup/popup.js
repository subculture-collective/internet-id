/**
 * Popup Script
 * Handles popup UI logic and interactions
 */

// State management
let currentTab = null;
let currentPlatformInfo = null;
let currentVerification = null;

// DOM elements
const states = {
  loading: document.getElementById("loading-state"),
  verified: document.getElementById("verified-state"),
  notVerified: document.getElementById("not-verified-state"),
  unsupported: document.getElementById("unsupported-state"),
  error: document.getElementById("error-state"),
};

// Initialize popup
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Popup loaded");

  // Get current tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];

  // Check API health
  checkApiHealth();

  // Verify current page
  await verifyCurrentPage();

  // Setup event listeners
  setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
  document.getElementById("verify-now-btn")?.addEventListener("click", handleVerifyNow);
  document.getElementById("retry-btn")?.addEventListener("click", verifyCurrentPage);
  document.getElementById("refresh-btn")?.addEventListener("click", handleRefresh);
  document.getElementById("dashboard-btn")?.addEventListener("click", handleOpenDashboard);
  document.getElementById("settings-btn")?.addEventListener("click", handleOpenSettings);
}

/**
 * Show specific state
 */
function showState(stateName) {
  // Hide all states
  Object.values(states).forEach((state) => {
    if (state) state.style.display = "none";
  });

  // Show requested state
  if (states[stateName]) {
    states[stateName].style.display = "block";
  }
}

/**
 * Verify current page
 */
async function verifyCurrentPage() {
  showState("loading");

  try {
    if (!currentTab || !currentTab.url) {
      showState("unsupported");
      return;
    }

    // Detect platform
    const platformInfo = detectPlatform(currentTab.url);
    currentPlatformInfo = platformInfo;

    if (platformInfo.platform === "unknown" || !platformInfo.platformId) {
      showState("unsupported");
      return;
    }

    // Request verification from background
    const response = await chrome.runtime.sendMessage({
      action: "verify",
      data: {
        url: currentTab.url,
        platform: platformInfo.platform,
        platformId: platformInfo.platformId,
      },
    });

    if (response.success && response.data) {
      currentVerification = response.data;

      if (response.data.contentHash) {
        // Content is verified
        displayVerifiedState(response.data);
      } else {
        // Not verified
        showState("notVerified");
      }
    } else {
      // Error or not found
      showState("notVerified");
    }
  } catch (error) {
    console.error("Verification error:", error);
    showErrorState(error.message);
  }
}

/**
 * Display verified state with data
 */
function displayVerifiedState(data) {
  showState("verified");

  // Update platform name
  const platformName = document.getElementById("platform-name");
  if (platformName && currentPlatformInfo) {
    platformName.textContent = capitalize(currentPlatformInfo.platform);
  }

  // Update creator address
  const creatorAddress = document.getElementById("creator-address");
  if (creatorAddress && data.creator) {
    creatorAddress.textContent = truncateAddress(data.creator);
    creatorAddress.title = data.creator;
  }

  // Update verified date
  const verifiedDate = document.getElementById("verified-date");
  if (verifiedDate && data.registeredAt) {
    verifiedDate.textContent = formatDate(data.registeredAt);
  }
}

/**
 * Show error state with message
 */
function showErrorState(message) {
  showState("error");
  const errorMessage = document.getElementById("error-message");
  if (errorMessage) {
    errorMessage.textContent = message || "An unexpected error occurred.";
  }
}

/**
 * Check API health
 */
async function checkApiHealth() {
  const statusElement = document.getElementById("api-status");
  if (!statusElement) return;

  try {
    const response = await chrome.runtime.sendMessage({ action: "checkHealth" });

    if (response.success && response.data.healthy) {
      statusElement.innerHTML = '<span class="status-dot healthy"></span> Connected';
    } else {
      statusElement.innerHTML = '<span class="status-dot unhealthy"></span> Disconnected';
    }
  } catch (error) {
    statusElement.innerHTML = '<span class="status-dot unhealthy"></span> Error';
  }
}

/**
 * Handle verify now button
 */
async function handleVerifyNow() {
  // Get settings to determine dashboard URL
  const settings = await chrome.storage.sync.get(["apiBase"]);
  const dashboardBase = settings.apiBase?.replace("3001", "3000") || "http://localhost:3000";

  // Open dashboard in verify mode
  chrome.tabs.create({ url: `${dashboardBase}/dashboard` });
}

/**
 * Handle refresh button
 */
async function handleRefresh() {
  // Clear cache for current URL
  if (currentTab?.url) {
    const cacheKey = `cache_${currentTab.url}`;
    await chrome.storage.local.remove([cacheKey]);
  }

  // Re-verify
  await verifyCurrentPage();

  // Re-check health
  await checkApiHealth();
}

/**
 * Handle open dashboard
 */
async function handleOpenDashboard() {
  const settings = await chrome.storage.sync.get(["apiBase"]);
  const dashboardBase = settings.apiBase?.replace("3001", "3000") || "http://localhost:3000";
  chrome.tabs.create({ url: `${dashboardBase}/dashboard` });
}

/**
 * Handle open settings
 */
function handleOpenSettings() {
  chrome.runtime.openOptionsPage();
}

/**
 * Detect platform from URL (simplified version for popup)
 */
function detectPlatform(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    const platformMap = {
      "youtube.com": "youtube",
      "twitter.com": "twitter",
      "x.com": "twitter",
      "instagram.com": "instagram",
      "github.com": "github",
      "tiktok.com": "tiktok",
      "linkedin.com": "linkedin",
    };

    for (const [domain, platform] of Object.entries(platformMap)) {
      if (hostname.includes(domain)) {
        const platformId = extractPlatformId(url, platform);
        return { platform, platformId, url };
      }
    }

    return { platform: "unknown", platformId: null, url };
  } catch (error) {
    return { platform: "unknown", platformId: null, url };
  }
}

/**
 * Extract platform-specific ID
 */
function extractPlatformId(url, platform) {
  const patterns = {
    youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    twitter: /(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/,
    instagram: /instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/,
    github: /github\.com\/([^\/]+)\/([^\/]+)/,
    tiktok: /tiktok\.com\/@[^\/]+\/video\/(\d+)/,
    linkedin: /linkedin\.com\/posts\/[^\/]+\/([^\/\?]+)/,
  };

  const pattern = patterns[platform];
  if (!pattern) return null;

  const match = url.match(pattern);
  if (!match) return null;

  // Return appropriate match group based on platform
  switch (platform) {
    case "twitter":
      return match[2];
    case "github":
      return `${match[1]}/${match[2]}`;
    default:
      return match[1];
  }
}

/**
 * Utility: Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Utility: Truncate Ethereum address
 */
function truncateAddress(address) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Utility: Format date
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Unknown";
  }
}
