/**
 * API Client for Internet ID
 * Handles communication with the Internet ID API
 */

// Default API endpoint - can be configured in options
const DEFAULT_API_BASE = "http://localhost:3001";

/**
 * Get API base URL from storage or use default
 * @returns {Promise<string>} API base URL
 */
async function getApiBase() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    const result = await chrome.storage.sync.get(["apiBase"]);
    return result.apiBase || DEFAULT_API_BASE;
  }
  return DEFAULT_API_BASE;
}

/**
 * Get API key from storage if configured
 * @returns {Promise<string|null>} API key or null
 */
async function getApiKey() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    const result = await chrome.storage.sync.get(["apiKey"]);
    return result.apiKey || null;
  }
  return null;
}

/**
 * Make API request
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
  const apiBase = await getApiBase();
  const apiKey = await getApiKey();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add API key if configured
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const url = `${apiBase}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

/**
 * Verify content by platform URL
 * @param {string} url - Platform URL to verify
 * @returns {Promise<object>} Verification result
 */
async function verifyByPlatform(url) {
  return apiRequest("/api/public-verify", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

/**
 * Resolve platform binding
 * @param {string} platform - Platform name
 * @param {string} platformId - Platform-specific ID
 * @returns {Promise<object>} Binding information
 */
async function resolveBinding(platform, platformId) {
  const params = new URLSearchParams({
    platform,
    platformId,
  });

  return apiRequest(`/api/resolve?${params}`);
}

/**
 * Get content metadata
 * @param {string} contentHash - Content hash
 * @returns {Promise<object>} Content metadata
 */
async function getContentMetadata(contentHash) {
  return apiRequest(`/api/contents/${contentHash}`);
}

/**
 * Bind platform ID to content
 * @param {object} bindingData - Binding data
 * @returns {Promise<object>} Binding result
 */
async function bindPlatform(bindingData) {
  return apiRequest("/api/bind", {
    method: "POST",
    body: JSON.stringify(bindingData),
  });
}

/**
 * Check API health
 * @returns {Promise<boolean>} True if API is healthy
 */
async function checkHealth() {
  try {
    const result = await apiRequest("/api/health");
    return result.status === "ok" || result.healthy === true;
  } catch (error) {
    console.error("Health check failed:", error);
    return false;
  }
}

/**
 * Get verification status for current page
 * @param {object} platformInfo - Platform information from detector
 * @returns {Promise<object>} Verification status
 */
async function getVerificationStatus(platformInfo) {
  const { platform, platformId, url } = platformInfo;

  if (!platformId) {
    return {
      verified: false,
      error: "Could not extract platform ID from URL",
    };
  }

  try {
    // Try to resolve binding first
    const binding = await resolveBinding(platform, platformId);

    if (binding && binding.contentHash) {
      // Get full verification details
      const verification = await verifyByPlatform(url);
      return {
        verified: true,
        binding,
        verification,
        contentHash: binding.contentHash,
      };
    }

    return {
      verified: false,
      message: "No verification found for this content",
    };
  } catch (error) {
    return {
      verified: false,
      error: error.message,
    };
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getApiBase,
    getApiKey,
    apiRequest,
    verifyByPlatform,
    resolveBinding,
    getContentMetadata,
    bindPlatform,
    checkHealth,
    getVerificationStatus,
  };
}
