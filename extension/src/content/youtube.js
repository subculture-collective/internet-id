/**
 * YouTube Content Script
 * Adds verification badges to YouTube videos
 */

console.log("Internet ID: YouTube content script loaded");

let currentVideoId = null;
let verificationBadgeAdded = false;

/**
 * Initialize content script
 */
async function init() {
  // Get settings
  const settings = await chrome.storage.sync.get(["autoVerify", "showBadges"]);

  if (!settings.autoVerify || !settings.showBadges) {
    console.log("Auto-verify or badges disabled");
    return;
  }

  // Check current video
  checkCurrentVideo();

  // Watch for URL changes (YouTube is SPA)
  watchForUrlChanges();

  // Observe DOM for dynamic content
  observeDomChanges();
}

/**
 * Check current video for verification
 */
async function checkCurrentVideo() {
  const videoId = extractVideoId(window.location.href);

  if (!videoId) {
    console.log("No video ID found");
    return;
  }

  if (videoId === currentVideoId && verificationBadgeAdded) {
    console.log("Badge already added for this video");
    return;
  }

  currentVideoId = videoId;
  verificationBadgeAdded = false;

  // Request verification from background
  try {
    const response = await chrome.runtime.sendMessage({
      action: "verify",
      data: {
        url: window.location.href,
        platform: "youtube",
        platformId: videoId,
      },
    });

    if (response.success && response.data && response.data.contentHash) {
      // Content is verified
      addVerificationBadge(response.data);
      updatePageBadge("✓", "#28a745");
    } else {
      // Not verified
      updatePageBadge("", "");
    }
  } catch (error) {
    console.error("Verification check failed:", error);
  }
}

/**
 * Add verification badge to video page
 */
function addVerificationBadge(verificationData) {
  // Wait for video title element to be available
  const checkInterval = setInterval(() => {
    // Target the video title container
    const titleContainer = document.querySelector("#above-the-fold #title h1.ytd-watch-metadata");

    if (titleContainer && !document.getElementById("internet-id-badge")) {
      clearInterval(checkInterval);

      // Create badge element safely (no innerHTML to prevent XSS)
      const badge = document.createElement("div");
      badge.id = "internet-id-badge";
      badge.className = "internet-id-verified-badge";

      // Create badge content
      const badgeContent = document.createElement("div");
      badgeContent.className = "badge-content";

      const badgeIcon = document.createElement("span");
      badgeIcon.className = "badge-icon";
      badgeIcon.textContent = "✓";

      const badgeText = document.createElement("span");
      badgeText.className = "badge-text";
      badgeText.textContent = "Verified by Internet ID";

      badgeContent.appendChild(badgeIcon);
      badgeContent.appendChild(badgeText);

      // Create tooltip
      const tooltip = document.createElement("div");
      tooltip.className = "badge-tooltip";

      const tooltipTitle = document.createElement("strong");
      tooltipTitle.textContent = "Content Verified";

      const tooltipDesc = document.createElement("p");
      tooltipDesc.textContent = "This content has been registered on the blockchain.";

      const tooltipCreator = document.createElement("p");
      tooltipCreator.className = "badge-creator";
      tooltipCreator.textContent = `Creator: ${truncateAddress(verificationData.creator)}`;

      tooltip.appendChild(tooltipTitle);
      tooltip.appendChild(tooltipDesc);
      tooltip.appendChild(tooltipCreator);

      badge.appendChild(badgeContent);
      badge.appendChild(tooltip);

      // Insert badge after title
      titleContainer.parentElement.insertBefore(badge, titleContainer.nextSibling);

      verificationBadgeAdded = true;
      console.log("Verification badge added");
    }
  }, 500);

  // Stop checking after 10 seconds
  setTimeout(() => clearInterval(checkInterval), 10000);
}

/**
 * Update extension badge for current tab
 */
function updatePageBadge(text, color) {
  chrome.runtime.sendMessage({
    action: "badge",
    data: { text, color },
  });
}

/**
 * Watch for URL changes
 */
function watchForUrlChanges() {
  let lastUrl = window.location.href;

  new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log("URL changed, checking new video");
      verificationBadgeAdded = false;
      setTimeout(checkCurrentVideo, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
}

/**
 * Observe DOM changes
 */
function observeDomChanges() {
  const observer = new MutationObserver((mutations) => {
    // Check if title container appeared (for SPA navigation)
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        const titleContainer = document.querySelector(
          "#above-the-fold #title h1.ytd-watch-metadata"
        );
        if (titleContainer && !verificationBadgeAdded && currentVideoId) {
          checkCurrentVideo();
          break;
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Extract video ID from URL
 */
function extractVideoId(url) {
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
 * Truncate Ethereum address
 */
function truncateAddress(address) {
  if (!address || address.length < 10) return address || "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
