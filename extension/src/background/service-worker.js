/**
 * Background Service Worker
 * Handles extension lifecycle, messaging, and background tasks
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Internet ID Verifier installed:", details.reason);

  if (details.reason === "install") {
    // First time installation
    await initializeExtension();

    // Open welcome/onboarding page
    chrome.tabs.create({
      url: chrome.runtime.getURL("src/options/options.html?welcome=true"),
    });
  } else if (details.reason === "update") {
    // Extension updated
    console.log("Extension updated to version:", chrome.runtime.getManifest().version);
  }
});

/**
 * Initialize extension with default settings
 */
async function initializeExtension() {
  const defaultSettings = {
    apiBase: "http://localhost:3001",
    apiKey: "",
    autoVerify: true,
    showBadges: true,
    notificationsEnabled: true,
    theme: "auto",
  };

  await chrome.storage.sync.set(defaultSettings);
  console.log("Extension initialized with default settings");
}

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request.action);

  switch (request.action) {
    case "verify":
      handleVerification(request.data)
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Will respond asynchronously

    case "checkHealth":
      checkApiHealth()
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case "getSettings":
      chrome.storage.sync
        .get(null)
        .then((settings) => sendResponse({ success: true, data: settings }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case "saveSettings":
      chrome.storage.sync
        .set(request.data)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case "openDashboard":
      handleOpenDashboard(request.data);
      sendResponse({ success: true });
      break;

    case "badge":
      updateBadge(request.data);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: "Unknown action" });
  }

  return false;
});

/**
 * Handle verification request
 */
async function handleVerification(data) {
  const { url, platform, platformId } = data;

  // Get API settings
  const settings = await chrome.storage.sync.get(["apiBase", "apiKey"]);
  const apiBase = settings.apiBase || "http://localhost:3001";
  const apiKey = settings.apiKey;

  // Check cache first
  const cacheKey = `cache_${url}`;
  const cached = await chrome.storage.local.get([cacheKey]);

  if (cached[cacheKey]) {
    const cacheData = cached[cacheKey];
    const age = Date.now() - cacheData.timestamp;

    // Return cached result if less than 5 minutes old
    if (age < 5 * 60 * 1000) {
      console.log("Returning cached verification result");
      return cacheData.result;
    }
  }

  // Make API request
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    // Use URLSearchParams for proper URL encoding
    const params = new URLSearchParams({
      platform: platform,
      platformId: platformId,
    });

    const response = await fetch(`${apiBase}/api/resolve?${params}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();

    // Cache the result
    await chrome.storage.local.set({
      [cacheKey]: {
        result,
        timestamp: Date.now(),
      },
    });

    return result;
  } catch (error) {
    console.error("Verification failed:", error);
    throw error;
  }
}

/**
 * Check API health
 */
async function checkApiHealth() {
  const settings = await chrome.storage.sync.get(["apiBase"]);
  const apiBase = settings.apiBase || "http://localhost:3001";

  try {
    const response = await fetch(`${apiBase}/api/health`);
    const data = await response.json();
    return {
      healthy: response.ok,
      status: data.status || "unknown",
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
}

/**
 * Open Internet ID dashboard
 */
function handleOpenDashboard(data) {
  const dashboardUrl = data?.url || "http://localhost:3000/dashboard";
  chrome.tabs.create({ url: dashboardUrl });
}

/**
 * Update extension badge
 */
function updateBadge(data) {
  const { text, color, tabId } = data;

  if (text !== undefined) {
    chrome.action.setBadgeText({
      text: String(text),
      tabId,
    });
  }

  if (color) {
    chrome.action.setBadgeBackgroundColor({
      color,
      tabId,
    });
  }
}

/**
 * Listen for tab updates to trigger verification
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when page is fully loaded
  if (changeInfo.status === "complete" && tab.url) {
    const settings = await chrome.storage.sync.get(["autoVerify", "showBadges"]);

    if (settings.autoVerify) {
      // Check if this is a supported platform
      const supportedDomains = [
        "youtube.com",
        "twitter.com",
        "x.com",
        "instagram.com",
        "github.com",
        "tiktok.com",
        "linkedin.com",
      ];

      const url = new URL(tab.url);
      const isSupported = supportedDomains.some((domain) => url.hostname.includes(domain));

      if (isSupported && settings.showBadges) {
        // Set a pending badge
        chrome.action.setBadgeText({
          text: "...",
          tabId,
        });
        chrome.action.setBadgeBackgroundColor({
          color: "#808080",
          tabId,
        });
      }
    }
  }
});

/**
 * Handle action click (when popup is disabled)
 */
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked for tab:", tab.id);
});

console.log("Internet ID Verifier service worker loaded");
