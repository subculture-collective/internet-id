/**
 * TikTok Content Script
 * Placeholder for TikTok verification badges
 */

console.log('Internet ID: TikTok content script loaded');

async function init() {
  const settings = await chrome.storage.sync.get(['autoVerify', 'showBadges']);
  
  if (!settings.autoVerify || !settings.showBadges) {
    return;
  }
  
  // TikTok implementation would go here
  // Similar pattern to YouTube and Twitter
  console.log('TikTok verification checking enabled');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
