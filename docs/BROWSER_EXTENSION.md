# Browser Extension Architecture

## Overview

The Internet ID Browser Extension provides seamless verification of human-created content directly on supported platforms. Users can verify content without leaving the page they're viewing, improving UX and conversion significantly.

## Architecture

### Manifest V3 Structure

The extension uses Chrome's Manifest V3 specification for modern browser compatibility and better security.

```json
{
  "manifest_version": 3,
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["https://youtube.com/*", ...],
  "background": {
    "service_worker": "src/background/service-worker.js"
  },
  "content_scripts": [...],
  "action": {
    "default_popup": "src/popup/popup.html"
  }
}
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Tab                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Platform Page (YouTube, Twitter, etc.)                │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Content Script                                   │  │ │
│  │  │  - Detects platform & content ID                  │  │ │
│  │  │  - Injects verification badges                    │  │ │
│  │  │  - Observes DOM changes                           │  │ │
│  │  └─────────┬────────────────────────────────────────┘  │ │
│  └────────────┼───────────────────────────────────────────┘ │
└───────────────┼──────────────────────────────────────────────┘
                │
                │ chrome.runtime.sendMessage()
                ▼
┌─────────────────────────────────────────────────────────────┐
│           Background Service Worker                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  - Message routing                                     │ │
│  │  - API communication                                   │ │
│  │  - Cache management                                    │ │
│  │  - Badge updates                                       │ │
│  └────────┬──────────────────────┬────────────────────────┘ │
└───────────┼──────────────────────┼───────────────────────────┘
            │                      │
            │ fetch()              │ chrome.storage
            ▼                      ▼
    ┌──────────────┐       ┌──────────────┐
    │  API Server  │       │   Storage    │
    │  (Internet   │       │  - Settings  │
    │   ID API)    │       │  - Cache     │
    └──────────────┘       └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Extension Popup                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  - Verification status                                 │ │
│  │  - Quick actions                                       │ │
│  │  - Dashboard link                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Options Page                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  - API configuration                                   │ │
│  │  - Verification settings                               │ │
│  │  - Wallet connection                                   │ │
│  │  - Privacy controls                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Background Service Worker

**File**: `extension/src/background/service-worker.js`

**Responsibilities**:

- Handle extension installation and updates
- Route messages between content scripts and popup
- Manage API communication
- Update extension badges
- Cache verification results
- Monitor tab updates

**Key Functions**:

```javascript
// Handle messages from content scripts/popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "verify":
      handleVerification(request.data);
    case "checkHealth":
      checkApiHealth();
    // ...
  }
});

// Auto-verify on tab load
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    // Trigger verification check
  }
});
```

### 2. Content Scripts

**Files**: `extension/src/content/*.js`

**Platform-Specific Implementations**:

- `youtube.js` - YouTube video pages
- `twitter.js` - Twitter/X posts
- `instagram.js` - Instagram posts
- `github.js` - GitHub repositories
- `tiktok.js` - TikTok videos
- `linkedin.js` - LinkedIn posts

**Responsibilities**:

- Detect current platform and extract content ID
- Send verification requests to background worker
- Inject verification badges into page DOM
- Observe DOM changes for SPA navigation
- Handle platform-specific UI injection

**Example Flow** (YouTube):

```javascript
// 1. Extract video ID from URL
const videoId = extractVideoId(window.location.href);

// 2. Request verification
const response = await chrome.runtime.sendMessage({
  action: "verify",
  data: { platform: "youtube", platformId: videoId },
});

// 3. Inject badge if verified
if (response.data.verified) {
  addVerificationBadge(response.data);
}

// 4. Watch for URL changes (SPA)
watchForUrlChanges();
```

### 3. Popup UI

**Files**: `extension/src/popup/*`

**Features**:

- Display current page verification status
- Show verification details (creator, date)
- Quick actions (Verify Now, Open Dashboard)
- API health indicator
- Settings access

**States**:

- Loading - Checking verification
- Verified - Content is verified (show details)
- Not Verified - No verification found
- Unsupported - Platform not supported
- Error - API or connection error

### 4. Options Page

**Files**: `extension/src/options/*`

**Settings**:

- **API Configuration**: Base URL, API key, connection test
- **Verification**: Auto-verify, show badges, notifications
- **Appearance**: Theme selection
- **Wallet**: Connect/disconnect Web3 wallet
- **Privacy**: Clear cache, reset settings

### 5. Utility Modules

**Platform Detector** (`utils/platform-detector.js`):

```javascript
// Detect platform from URL
detectPlatform(url) → 'youtube' | 'twitter' | ...

// Extract platform-specific ID
extractPlatformId(url) → { platform, platformId, additionalInfo }
```

**API Client** (`utils/api-client.js`):

```javascript
// Verify content by URL
verifyByPlatform(url) → Promise<VerificationResult>

// Resolve platform binding
resolveBinding(platform, platformId) → Promise<Binding>

// Check API health
checkHealth() → Promise<boolean>
```

**Storage** (`utils/storage.js`):

```javascript
// Settings management
getSettings() → Promise<Settings>
saveSettings(settings) → Promise<void>

// Cache management
cacheVerification(url, result) → Promise<void>
getCachedVerification(url) → Promise<Result|null>

// Wallet management
saveWallet(walletInfo) → Promise<void>
getWallet() → Promise<WalletInfo|null>
```

## Platform Detection

### Supported Platforms

| Platform  | URL Pattern              | ID Extraction             |
| --------- | ------------------------ | ------------------------- |
| YouTube   | `youtube.com/watch?v=*`  | Video ID from query param |
| Twitter/X | `twitter.com/*/status/*` | Tweet ID from path        |
| Instagram | `instagram.com/p/*`      | Post ID from path         |
| GitHub    | `github.com/*/*`         | owner/repo from path      |
| TikTok    | `tiktok.com/@*/video/*`  | Video ID from path        |
| LinkedIn  | `linkedin.com/posts/*/*` | Post ID from path         |

### Detection Algorithm

```javascript
function detectPlatform(url) {
  const hostname = new URL(url).hostname;

  // Match hostname to platform
  if (hostname.includes("youtube.com")) return "youtube";
  if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter";
  // ...

  return "unknown";
}
```

## Verification Flow

### Auto-Verification

1. User visits supported platform page
2. Content script loads and detects platform
3. Extract content ID from URL
4. Check cache for recent result
5. If not cached, request verification from background
6. Background queries API
7. Cache result for 5 minutes
8. Inject badge if verified
9. Update extension icon badge

### Manual Verification

1. User clicks extension icon
2. Popup detects current tab URL
3. Extract platform and content ID
4. Request verification status
5. Display result in popup
6. User can click "Verify Now" to register content

## Badge Injection

### Badge Design

```html
<div class="internet-id-verified-badge">
  <div class="badge-content">
    <span class="badge-icon">✓</span>
    <span class="badge-text">Verified by Internet ID</span>
  </div>
  <div class="badge-tooltip">
    <strong>Content Verified</strong>
    <p>This content has been registered on the blockchain.</p>
    <p class="badge-creator">Creator: 0xABCD...1234</p>
  </div>
</div>
```

### Injection Strategy

**YouTube**: Insert after video title

```javascript
const titleContainer = document.querySelector("#above-the-fold #title h1");
titleContainer.parentElement.insertBefore(badge, titleContainer.nextSibling);
```

**Twitter/X**: Insert after tweet text

```javascript
const tweetText = tweetElement.querySelector('[data-testid="tweetText"]');
tweetText.parentElement.insertBefore(badge, tweetText.nextSibling);
```

### Handling SPAs

Many platforms (YouTube, Twitter) are Single Page Applications:

```javascript
// Watch for URL changes without page reload
let lastUrl = window.location.href;

new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    checkNewPage();
  }
}).observe(document, { subtree: true, childList: true });
```

## Caching Strategy

### Cache Policy

- **TTL**: 5 minutes
- **Storage**: `chrome.storage.local`
- **Key Format**: `cache_${url}`
- **Invalidation**: Manual (clear cache) or TTL expiry

### Cache Implementation

```javascript
// Store with timestamp
await chrome.storage.local.set({
  [`cache_${url}`]: {
    result: verificationData,
    timestamp: Date.now(),
    ttl: 5 * 60 * 1000,
  },
});

// Check age before returning
const age = Date.now() - cacheData.timestamp;
if (age < cacheData.ttl) {
  return cacheData.result;
}
```

## Wallet Integration

### MetaMask Connection

```javascript
async function connectWallet() {
  // Check for provider
  if (typeof window.ethereum === "undefined") {
    alert("Please install MetaMask");
    return;
  }

  // Request accounts
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  // Store wallet info
  await chrome.storage.local.set({
    wallet: {
      address: accounts[0],
      connected: true,
    },
  });
}
```

### Signing Support

Future: Enable signing verification messages directly in extension.

## Privacy & Security

### Data Minimization

- Only store necessary settings
- No tracking or analytics in extension
- Cache limited to 5 minutes
- User can clear cache at any time

### Permissions Justification

- `storage`: Save settings and cache
- `activeTab`: Access current page URL only when extension is used
- `scripting`: Inject verification badges

### Host Permissions

Only request access to supported platforms where badges are displayed.

### API Communication

- All API requests go through configured endpoint
- Optional API key support
- No data sent without user action
- SSL/TLS recommended for API

## Error Handling

### API Errors

```javascript
try {
  const result = await apiRequest(endpoint);
  return result;
} catch (error) {
  console.error("API error:", error);
  // Show error state in UI
  showErrorState(error.message);
}
```

### Content Script Errors

- Fail gracefully if badge injection fails
- Log errors to console for debugging
- Don't break page functionality

### User-Facing Errors

- Clear error messages in popup
- Retry buttons where appropriate
- Link to settings for configuration issues

## Performance Optimization

### Lazy Loading

- Content scripts only load on supported platforms
- Badge injection deferred until verification complete

### Debouncing

- Limit verification checks during rapid navigation
- Cache results to avoid redundant API calls

### Bundle Size

Current unminified: ~50KB total

- Background: ~6KB
- Content scripts: ~3-5KB each
- Popup: ~15KB
- Options: ~10KB
- Utils: ~13KB

## Testing

### Manual Testing

1. Load extension in developer mode
2. Navigate to test pages with known verification status
3. Verify badges appear correctly
4. Test popup functionality
5. Test settings persistence

### Automated Testing

Future: Add unit tests for utilities and integration tests for components.

## Deployment

### Chrome Web Store

1. Build production ZIP
2. Upload to Developer Dashboard
3. Fill out store listing
4. Submit for review

### Firefox Add-ons

1. Convert to Manifest V2
2. Update background scripts
3. Submit to AMO

### Safari Extensions

1. Convert using Xcode
2. Build Safari App Extension
3. Submit to App Store

## Roadmap

### Phase 1 (Current)

- ✅ Chrome/Chromium support
- ✅ YouTube and Twitter verification
- ✅ Basic popup and settings

### Phase 2

- Complete all platform implementations
- Enhanced badge designs
- Usage analytics
- Error reporting

### Phase 3

- Firefox and Safari ports
- Store publications
- Internationalization
- Wallet signing features

### Phase 4

- Advanced features
- Multi-wallet support
- Batch verification
- Integration with dashboard

## Contributing

See [extension/README.md](../extension/README.md) for development setup and contribution guidelines.

## References

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)
