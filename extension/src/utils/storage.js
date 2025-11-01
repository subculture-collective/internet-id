/**
 * Storage Utilities
 * Manages extension settings and cached data
 */

/**
 * Default settings
 */
const DEFAULT_SETTINGS = {
  apiBase: 'http://localhost:3001',
  apiKey: '',
  autoVerify: true,
  showBadges: true,
  notificationsEnabled: true,
  walletAddress: null,
  theme: 'auto' // 'light', 'dark', 'auto'
};

/**
 * Get all settings
 * @returns {Promise<object>} Settings object
 */
async function getSettings() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    return result;
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings
 * @param {object} settings - Settings to save
 * @returns {Promise<void>}
 */
async function saveSettings(settings) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    await chrome.storage.sync.set(settings);
  }
}

/**
 * Get specific setting
 * @param {string} key - Setting key
 * @returns {Promise<any>} Setting value
 */
async function getSetting(key) {
  const settings = await getSettings();
  return settings[key];
}

/**
 * Save specific setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<void>}
 */
async function saveSetting(key, value) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    await chrome.storage.sync.set({ [key]: value });
  }
}

/**
 * Cache verification result
 * @param {string} url - URL key
 * @param {object} result - Verification result
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {Promise<void>}
 */
async function cacheVerification(url, result, ttl = 5 * 60 * 1000) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const cacheKey = `cache_${url}`;
    const cacheData = {
      result,
      timestamp: Date.now(),
      ttl
    };
    await chrome.storage.local.set({ [cacheKey]: cacheData });
  }
}

/**
 * Get cached verification result
 * @param {string} url - URL key
 * @returns {Promise<object|null>} Cached result or null if expired/not found
 */
async function getCachedVerification(url) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const cacheKey = `cache_${url}`;
    const result = await chrome.storage.local.get([cacheKey]);
    const cacheData = result[cacheKey];
    
    if (cacheData) {
      const age = Date.now() - cacheData.timestamp;
      if (age < cacheData.ttl) {
        return cacheData.result;
      }
      // Expired, remove it
      await chrome.storage.local.remove([cacheKey]);
    }
  }
  return null;
}

/**
 * Clear all cached verifications
 * @returns {Promise<void>}
 */
async function clearCache() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const items = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(items).filter(key => key.startsWith('cache_'));
    if (cacheKeys.length > 0) {
      await chrome.storage.local.remove(cacheKeys);
    }
  }
}

/**
 * Save wallet information
 * @param {object} walletInfo - Wallet information
 * @returns {Promise<void>}
 */
async function saveWallet(walletInfo) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    await chrome.storage.local.set({
      wallet: walletInfo,
      walletTimestamp: Date.now()
    });
  }
}

/**
 * Get wallet information
 * @returns {Promise<object|null>} Wallet info or null
 */
async function getWallet() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const result = await chrome.storage.local.get(['wallet', 'walletTimestamp']);
    if (result.wallet) {
      return result.wallet;
    }
  }
  return null;
}

/**
 * Clear wallet information
 * @returns {Promise<void>}
 */
async function clearWallet() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    await chrome.storage.local.remove(['wallet', 'walletTimestamp']);
  }
}

/**
 * Reset all settings to defaults
 * @returns {Promise<void>}
 */
async function resetSettings() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    await saveSettings(DEFAULT_SETTINGS);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_SETTINGS,
    getSettings,
    saveSettings,
    getSetting,
    saveSetting,
    cacheVerification,
    getCachedVerification,
    clearCache,
    saveWallet,
    getWallet,
    clearWallet,
    resetSettings
  };
}
