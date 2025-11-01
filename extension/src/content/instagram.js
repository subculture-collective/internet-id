/**
 * Instagram Content Script
 * Placeholder for Instagram verification badges
 */

console.log('Internet ID: Instagram content script loaded');

async function init() {
  const settings = await chrome.storage.sync.get(['autoVerify', 'showBadges']);
  
  if (!settings.autoVerify || !settings.showBadges) {
    return;
  }
  
  // Instagram implementation would go here
  // Similar pattern to YouTube and Twitter
  console.log('Instagram verification checking enabled');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
