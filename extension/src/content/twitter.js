/**
 * Twitter/X Content Script
 * Adds verification badges to Twitter/X posts
 */

console.log('Internet ID: Twitter/X content script loaded');

/**
 * Initialize content script
 */
async function init() {
  const settings = await chrome.storage.sync.get(['autoVerify', 'showBadges']);
  
  if (!settings.autoVerify || !settings.showBadges) {
    console.log('Auto-verify or badges disabled');
    return;
  }
  
  // Observe DOM for tweet elements
  observeTweets();
}

/**
 * Observe DOM for tweet elements
 */
function observeTweets() {
  const observer = new MutationObserver((mutations) => {
    // Check for tweet articles
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    tweets.forEach(checkTweet);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Check existing tweets
  const existingTweets = document.querySelectorAll('article[data-testid="tweet"]');
  existingTweets.forEach(checkTweet);
}

/**
 * Check individual tweet for verification
 */
async function checkTweet(tweetElement) {
  // Skip if already checked
  if (tweetElement.dataset.internetIdChecked) {
    return;
  }
  tweetElement.dataset.internetIdChecked = 'true';
  
  // Try to extract tweet ID from the element
  const tweetId = extractTweetId(tweetElement);
  
  if (!tweetId) {
    return;
  }
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'verify',
      data: {
        url: `https://twitter.com/status/${tweetId}`,
        platform: 'twitter',
        platformId: tweetId
      }
    });
    
    if (response.success && response.data && response.data.contentHash) {
      addBadgeToTweet(tweetElement, response.data);
    }
  } catch (error) {
    console.error('Tweet verification failed:', error);
  }
}

/**
 * Extract tweet ID from tweet element
 */
function extractTweetId(tweetElement) {
  // Try to find a link with status in it
  const links = tweetElement.querySelectorAll('a[href*="/status/"]');
  
  for (const link of links) {
    const match = link.href.match(/\/status\/(\d+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Add verification badge to tweet
 */
function addBadgeToTweet(tweetElement, verificationData) {
  // Find a good place to insert the badge (after tweet text)
  const tweetText = tweetElement.querySelector('[data-testid="tweetText"]');
  
  if (!tweetText || tweetElement.querySelector('.internet-id-verified-badge')) {
    return;
  }
  
  const badge = document.createElement('div');
  badge.className = 'internet-id-verified-badge';
  badge.innerHTML = `
    <div class="badge-content">
      <span class="badge-icon">✓</span>
      <span class="badge-text">Verified</span>
    </div>
    <div class="badge-tooltip">
      <strong>Content Verified</strong>
      <p>This content has been registered on the blockchain.</p>
      <p class="badge-creator">Creator: ${truncateAddress(verificationData.creator)}</p>
    </div>
  `;
  
  // Insert after tweet text
  tweetText.parentElement.insertBefore(badge, tweetText.nextSibling);
}

/**
 * Truncate Ethereum address
 */
function truncateAddress(address) {
  if (!address || address.length < 10) return address || 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
