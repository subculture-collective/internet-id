/**
 * Options Page Script
 * Handles settings configuration and user preferences
 */

// Default settings
const DEFAULT_SETTINGS = {
  apiBase: 'http://localhost:3001',
  apiKey: '',
  autoVerify: true,
  showBadges: true,
  notificationsEnabled: true,
  theme: 'auto'
};

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Options page loaded');
  
  // Check if this is first visit (welcome)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('welcome') === 'true') {
    showWelcomeBanner();
  }
  
  // Load current settings
  await loadSettings();
  
  // Setup event listeners
  setupEventListeners();
});

/**
 * Show welcome banner
 */
function showWelcomeBanner() {
  const banner = document.getElementById('welcome-banner');
  if (banner) {
    banner.style.display = 'block';
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Dismiss welcome
  document.getElementById('dismiss-welcome')?.addEventListener('click', () => {
    const banner = document.getElementById('welcome-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  });
  
  // Test connection
  document.getElementById('test-connection')?.addEventListener('click', testConnection);
  
  // Save settings
  document.getElementById('save-settings')?.addEventListener('click', saveSettings);
  
  // Connect wallet
  document.getElementById('connect-wallet')?.addEventListener('click', connectWallet);
  document.getElementById('disconnect-wallet')?.addEventListener('click', disconnectWallet);
  
  // Clear cache
  document.getElementById('clear-cache')?.addEventListener('click', clearCache);
  
  // Reset settings
  document.getElementById('reset-settings')?.addEventListener('click', resetSettings);
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    
    // Populate form fields
    document.getElementById('api-base').value = settings.apiBase || DEFAULT_SETTINGS.apiBase;
    document.getElementById('api-key').value = settings.apiKey || '';
    document.getElementById('auto-verify').checked = settings.autoVerify !== false;
    document.getElementById('show-badges').checked = settings.showBadges !== false;
    document.getElementById('notifications-enabled').checked = settings.notificationsEnabled !== false;
    document.getElementById('theme').value = settings.theme || 'auto';
    
    // Check wallet status
    await checkWalletStatus();
    
    console.log('Settings loaded:', settings);
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('save-status', 'Error loading settings', 'error');
  }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  const saveButton = document.getElementById('save-settings');
  const statusElement = document.getElementById('save-status');
  
  try {
    // Disable button
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    
    // Get form values
    const settings = {
      apiBase: document.getElementById('api-base').value.trim() || DEFAULT_SETTINGS.apiBase,
      apiKey: document.getElementById('api-key').value.trim(),
      autoVerify: document.getElementById('auto-verify').checked,
      showBadges: document.getElementById('show-badges').checked,
      notificationsEnabled: document.getElementById('notifications-enabled').checked,
      theme: document.getElementById('theme').value
    };
    
    // Validate API base URL
    try {
      new URL(settings.apiBase);
    } catch (e) {
      throw new Error('Invalid API base URL');
    }
    
    // Save to storage
    await chrome.storage.sync.set(settings);
    
    // Show success
    showStatus('save-status', 'Settings saved successfully!', 'success');
    console.log('Settings saved:', settings);
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('save-status', `Error: ${error.message}`, 'error');
  } finally {
    // Re-enable button
    saveButton.disabled = false;
    saveButton.textContent = 'Save Settings';
  }
}

/**
 * Test API connection
 */
async function testConnection() {
  const button = document.getElementById('test-connection');
  const statusElement = document.getElementById('connection-status');
  
  try {
    button.disabled = true;
    button.textContent = 'Testing...';
    
    const apiBase = document.getElementById('api-base').value.trim() || DEFAULT_SETTINGS.apiBase;
    const apiKey = document.getElementById('api-key').value.trim();
    
    // Validate URL
    new URL(apiBase);
    
    // Make test request
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }
    
    const response = await fetch(`${apiBase}/api/health`, { headers });
    
    if (response.ok) {
      const data = await response.json();
      showStatus('connection-status', `✓ Connection successful! Status: ${data.status || 'ok'}`, 'success');
    } else {
      showStatus('connection-status', `✗ Connection failed: ${response.status} ${response.statusText}`, 'error');
    }
  } catch (error) {
    console.error('Connection test error:', error);
    showStatus('connection-status', `✗ Connection error: ${error.message}`, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Test Connection';
  }
}

/**
 * Connect wallet
 */
async function connectWallet() {
  const button = document.getElementById('connect-wallet');
  
  try {
    button.disabled = true;
    button.textContent = 'Connecting...';
    
    // Check if MetaMask is available
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Web3 wallet to connect.');
      return;
    }
    
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (accounts && accounts.length > 0) {
      const walletInfo = {
        address: accounts[0],
        connected: true,
        timestamp: Date.now()
      };
      
      // Save wallet info
      await chrome.storage.local.set({ wallet: walletInfo });
      
      // Update UI
      await checkWalletStatus();
      
      showStatus('save-status', 'Wallet connected successfully!', 'success');
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
    alert(`Failed to connect wallet: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = 'Connect Wallet';
  }
}

/**
 * Disconnect wallet
 */
async function disconnectWallet() {
  try {
    await chrome.storage.local.remove(['wallet']);
    await checkWalletStatus();
    showStatus('save-status', 'Wallet disconnected', 'info');
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
}

/**
 * Check wallet connection status
 */
async function checkWalletStatus() {
  const result = await chrome.storage.local.get(['wallet']);
  const wallet = result.wallet;
  
  const connectedDiv = document.getElementById('wallet-connected');
  const disconnectedDiv = document.getElementById('wallet-disconnected');
  const addressElement = document.getElementById('wallet-address');
  
  if (wallet && wallet.connected && wallet.address) {
    // Wallet is connected
    connectedDiv.style.display = 'block';
    disconnectedDiv.style.display = 'none';
    
    if (addressElement) {
      addressElement.textContent = wallet.address;
    }
  } else {
    // Wallet not connected
    connectedDiv.style.display = 'none';
    disconnectedDiv.style.display = 'block';
  }
}

/**
 * Clear cache
 */
async function clearCache() {
  const button = document.getElementById('clear-cache');
  
  try {
    button.disabled = true;
    button.textContent = 'Clearing...';
    
    // Get all items and remove cache entries
    const items = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(items).filter(key => key.startsWith('cache_'));
    
    if (cacheKeys.length > 0) {
      await chrome.storage.local.remove(cacheKeys);
      showStatus('save-status', `Cache cleared (${cacheKeys.length} items removed)`, 'success');
    } else {
      showStatus('save-status', 'Cache is already empty', 'info');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    showStatus('save-status', 'Error clearing cache', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Clear Cache';
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
    return;
  }
  
  const button = document.getElementById('reset-settings');
  
  try {
    button.disabled = true;
    button.textContent = 'Resetting...';
    
    // Clear all storage
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    
    // Set defaults
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
    
    // Reload settings
    await loadSettings();
    
    showStatus('save-status', 'Settings reset to defaults', 'success');
  } catch (error) {
    console.error('Error resetting settings:', error);
    showStatus('save-status', 'Error resetting settings', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Reset All Settings';
  }
}

/**
 * Show status message
 */
function showStatus(elementId, message, type = 'info') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.textContent = message;
  element.className = `status-message ${type}`;
  element.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}
