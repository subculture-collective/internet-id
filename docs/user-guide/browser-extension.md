# Using the Browser Extension

The Internet ID browser extension provides seamless, one-click verification directly on YouTube, Twitter, and other supported platforms.

## 📋 Table of Contents

- [What is the Browser Extension?](#what-is-the-browser-extension)
- [Installation](#installation)
- [Features](#features)
- [How to Use](#how-to-use)
- [Supported Platforms](#supported-platforms)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## What is the Browser Extension?

The Internet ID browser extension brings verification to where you browse:

- **Automatic Detection**: Checks content as you browse
- **Visual Badges**: Shows verification status on pages
- **One-Click Verification**: Get details instantly
- **Privacy-Focused**: No tracking, local caching only
- **Open Source**: Audit the code yourself

**No wallet or blockchain knowledge needed to use it!**

## Installation

### Chrome, Edge, Brave (Chromium-based)

#### Option 1: From Chrome Web Store (Coming Soon)

1. Visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "Internet ID"
3. Click "Add to Chrome"
4. Click "Add extension"

**Status**: Under review. Use manual installation below for now.

#### Option 2: Manual Installation (Current Method)

1. **Download the Extension**

   ```bash
   git clone https://github.com/subculture-collective/internet-id.git
   cd internet-id/extension
   npm install
   npm run build
   ```

2. **Load in Browser**
   - Open Chrome/Edge/Brave
   - Go to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `internet-id/extension/dist` folder
   - Extension icon should appear in toolbar

3. **Pin the Extension** (Optional)
   - Click the puzzle piece icon (Extensions)
   - Find "Internet ID"
   - Click the pin icon
   - Extension icon now always visible

### Firefox

#### Option 1: From Firefox Add-ons (Coming Soon)

1. Visit [Firefox Add-ons](https://addons.mozilla.org/)
2. Search for "Internet ID"
3. Click "Add to Firefox"

**Status**: Preparing submission. Use manual installation below for now.

#### Option 2: Manual Installation (Current Method)

1. **Download and Build**

   ```bash
   git clone https://github.com/subculture-collective/internet-id.git
   cd internet-id/extension
   npm install
   npm run build:firefox
   ```

2. **Load Temporary Add-on**
   - Open Firefox
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `internet-id/extension/dist/manifest.json`
   - Extension loaded (until browser restart)

3. **For Permanent Installation**
   - Package extension: `npm run package:firefox`
   - Submit to Firefox Add-ons for signing
   - Or use Firefox Developer Edition with signing disabled

### Safari (macOS)

**Status**: In development. Safari support coming Q1 2026.

For now, use the web app at [app.internet-id.io](https://app.internet-id.io).

## Features

### Automatic Content Detection

**What it does**:

- Detects when you visit supported platforms
- Extracts content ID (video ID, tweet ID, etc.)
- Queries Internet ID API for verification
- Shows result instantly

**Supported**:

- YouTube videos
- Twitter/X posts
- TikTok videos
- Instagram posts
- GitHub repositories

**Privacy**: Only checks when you explicitly visit content. No tracking.

### Visual Verification Badges

**Badge Types**:

**✅ Verified** (Green badge)

- Content is registered and verified
- Creator signature valid
- On-chain record exists

**⚠️ Platform Verified** (Yellow badge)

- Platform binding exists
- Original file is registered
- Platform re-encoded content (normal)

**❌ Not Verified** (No badge shown)

- No verification found
- Content not registered
- Or extension can't detect binding

**Badge Placement**:

- YouTube: Top-right of player
- Twitter: Top-right of media
- Customizable in settings

### One-Click Verification

**Click the badge** to see:

- Full verification details
- Creator wallet address
- Registration timestamp
- Transaction proof
- Manifest details
- Quick actions (share, copy, etc.)

**Click the extension icon** to:

- Verify current page
- Access settings
- View verification history
- Register new content (if wallet connected)

### Verification History

**Recent Checks**:

- Last 50 verified contents
- Quick access to previously checked
- Clear history anytime

**Favorites** (Coming Soon):

- Star favorite creators
- Get notifications when they post verified content
- Quick access to their content

### Quick Actions

From badge or popup:

- **View Full Details**: Open verification page
- **Share Verification**: Copy link or share on social
- **Download Proof**: Get proof bundle
- **Copy Verification Link**: Quick copy to clipboard
- **Report Issue**: Flag problems (fake verifications, etc.)

## How to Use

### Basic Usage

1. **Install Extension** (see [Installation](#installation))

2. **Visit Supported Platform**
   - YouTube, Twitter, TikTok, etc.
   - Extension automatically checks content

3. **Look for Badge**
   - ✅ Green = Verified
   - ⚠️ Yellow = Platform verified
   - No badge = Not verified

4. **Click for Details**
   - Click badge or extension icon
   - See full verification info
   - Access quick actions

**That's it!** No configuration required for basic use.

### Advanced Usage

#### Connect Wallet (Optional)

**Why connect?**

- Register content directly from extension
- Sign in to dashboard from extension
- Manage your content

**How to connect**:

1. Click extension icon
2. Click "Connect Wallet"
3. Choose wallet (MetaMask)
4. Approve connection
5. You're connected!

**Security**: Connection is per-site. Your wallet is safe.

#### Auto-Verify Settings

Control automatic checking:

1. Click extension icon
2. Go to **Settings**
3. Toggle **"Auto-verify content"**
   - ✅ On: Checks automatically (default)
   - ❌ Off: Only checks when you click icon

**When to disable**:

- Privacy concerns (less API calls)
- Slow connection (manual checking)
- Battery saving (mobile)

#### Badge Display Settings

Customize badge appearance:

1. Extension icon → **Settings**
2. **Badge Settings**:
   - Enable/disable badges
   - Choose position (top-left, top-right, bottom-right, bottom-left)
   - Choose size (small, medium, large)
   - Choose theme (light, dark, auto)

#### Cache Settings

Control how verification results are cached:

1. Extension icon → **Settings**
2. **Cache Settings**:
   - Cache duration (default: 5 minutes)
   - Clear cache manually
   - Disable cache (always check)

**Recommendation**: Keep default 5 minutes. Reduces API calls without stale data.

#### Notification Settings (Coming Soon)

Get notified when:

- Favorite creator posts verified content
- New platform supported
- Important updates

## Supported Platforms

### Fully Supported ✅

Automatic detection and badge display:

**YouTube**

- Video pages
- Embedded videos
- Shorts

**Twitter/X**

- Tweets with media
- Quoted tweets
- Embedded tweets

### Partial Support 🔄

Automatic detection, badge coming soon:

**TikTok**

- Video pages
- Manual verify in extension

**Instagram**

- Post pages
- Manual verify in extension

**GitHub**

- Repository files
- Gists
- Manual verify in extension

### Manual Verification Only 📋

Extension can verify, but no automatic detection yet:

- LinkedIn posts
- Discord messages
- Medium articles
- Generic URLs (via "Verify URL" in extension)

### Coming Soon 🚀

- Twitch clips and VODs
- Reddit posts
- Spotify (via Web API)
- Vimeo videos
- SoundCloud tracks

Want to see your favorite platform? [Request it](https://discord.gg/internetid)!

## Configuration

### API Endpoint

By default, extension uses production API: `https://app.internet-id.io/api`

**To change** (for testing or self-hosted):

1. Extension icon → Settings
2. API Configuration
3. Enter custom endpoint
4. Click "Test Connection"
5. Save if successful

**Self-hosted users**: Point to your own API instance.

### Network Selection

Choose which blockchain network to query:

1. Extension icon → Settings
2. Network Selection
3. Choose: Base (default), Polygon, Ethereum, etc.
4. Extension will query selected network

**Note**: Most content is on Base or Polygon. Try both if not found.

### Privacy Settings

**What data is sent**:

- Content URL or ID (only when verifying)
- No personal information
- No tracking cookies
- No analytics

**Local storage only**:

- Verification cache
- Settings preferences
- Connection status

**We never collect**:

- Browsing history
- Personal data
- Wallet private keys

See [Privacy Policy](./privacy-security.md) for details.

## Troubleshooting

### Extension Not Loading

**Problem**: Extension icon missing or grayed out

**Solutions**:

1. Check extension is enabled in browser
2. Refresh browser extension page
3. Reload extension (toggle off/on)
4. Reinstall extension
5. Check browser console for errors

### Badge Not Appearing

**Problem**: No badge on verified content

**Solutions**:

1. **Check "Enable badges" in settings**
   - Extension icon → Settings → Enable badges

2. **Refresh the page**
   - Extension checks on page load
   - Reload platform page

3. **Check content is verified**
   - Click extension icon → "Verify this page"
   - If not verified, badge won't show (correct behavior)

4. **Check platform supported**
   - Automatic badges only on YouTube, Twitter for now
   - Other platforms: Use extension popup

5. **Clear cache**
   - Settings → Clear cache
   - Refresh page

6. **Check badge position**
   - Badge might be off-screen
   - Try different position in settings

### Extension Slow or Unresponsive

**Problem**: Extension takes long time to respond

**Solutions**:

1. **Check internet connection**
   - Extension queries API
   - Slow connection = slow checks

2. **Check API status**
   - Visit [app.internet-id.io](https://app.internet-id.io)
   - If site is down, extension can't work

3. **Clear cache**
   - Old cache might be corrupted
   - Settings → Clear cache

4. **Reduce auto-checks**
   - Disable auto-verify in settings
   - Manually verify only when needed

5. **Check browser performance**
   - Close other extensions temporarily
   - Clear browser cache
   - Restart browser

### Verification Always Fails

**Problem**: Extension shows "Not verified" for known verified content

**Solutions**:

1. **Check network selection**
   - Content might be on different network
   - Try switching networks in settings

2. **Check API endpoint**
   - Might be pointing to wrong instance
   - Reset to default: `https://app.internet-id.io/api`

3. **Test connection**
   - Settings → Test Connection
   - Should show green checkmark

4. **Check directly on website**
   - Visit [app.internet-id.io/verify](https://app.internet-id.io/verify)
   - If works there but not in extension, file bug report

### Wallet Won't Connect

**Problem**: Can't connect wallet to extension

**Solutions**:

1. **Check wallet extension installed**
   - MetaMask or compatible wallet
   - Restart browser after installing

2. **Unlock wallet**
   - Wallet must be unlocked
   - Enter password in wallet extension

3. **Check permissions**
   - Wallet might have rejected connection
   - Open wallet → Connections → Remove Internet ID → Reconnect

4. **Try different wallet**
   - If MetaMask doesn't work, try Coinbase Wallet or others

5. **Wallet not required**
   - Can use extension without wallet
   - Wallet only needed to register content

## Security & Permissions

### Permissions Required

The extension requests minimal permissions:

**activeTab**

- Access current tab only when you click extension icon
- Never accesses tabs you don't interact with

**storage**

- Store settings locally
- Cache verification results

**host permissions** (specific domains only):

- `*://youtube.com/*` - Detect YouTube videos
- `*://twitter.com/*` - Detect tweets
- `*://app.internet-id.io/*` - Query API

**We never request**:

- "Read and change all your data" (too broad)
- Tabs (access to all tabs)
- History (browsing history)
- Downloads (download manager)
- Bookmarks (bookmark access)

### Data Security

**What's stored locally**:

- Extension settings
- Verification cache (5 minutes TTL)
- Recently checked content list

**What's NOT stored**:

- Browsing history
- Wallet private keys
- Personal information

**Data transmission**:

- Only when verifying content
- HTTPS encrypted
- To Internet ID API only

**Open source**:

- Full code available on GitHub
- Audit it yourself
- Contributions welcome

See [Browser Extension Security](../BROWSER_EXTENSION_SECURITY.md) for technical details.

## FAQ

### Do I need a wallet to use the extension?

**No!** Wallet is only needed if you want to register content from the extension. For verification, no wallet required.

### Does the extension track me?

**No!** The extension:

- Only checks content when you visit it
- Doesn't track browsing history
- Doesn't send analytics
- Stores data locally only

### Will this slow down my browser?

**No!** The extension:

- Only activates on supported platforms
- Uses minimal resources
- Caches results to reduce API calls
- Can be disabled on specific sites

### Can I use it on mobile?

**Yes, with limitations:**

- **Mobile Chrome/Firefox**: Extensions not supported on mobile browsers
- **Mobile Safari**: No extension support
- **Workaround**: Use mobile web app at [app.internet-id.io](https://app.internet-id.io)

**Mobile extension support**: Coming when browsers add support.

### How do I update the extension?

**From Store** (when available):

- Automatic updates enabled by default
- Or manually: Extensions page → Developer mode → Update

**Manual Installation**:

- Pull latest from GitHub
- Run `npm run build`
- Extension → Remove → Reload with new build

### Can I disable it on specific sites?

**Yes!**

1. Right-click extension icon
2. Choose "Manage extension"
3. Site access → On click/On specific sites
4. Configure as needed

## Next Steps

- **[Verifying Content](./verifying-content.md)** - Learn more about verification
- **[Platform Bindings](./platform-bindings.md)** - How content gets verified
- **[FAQ](./faq.md)** - Common questions
- **[Troubleshooting](./troubleshooting.md)** - More solutions

## Get Help

Questions about the extension?

- **[FAQ](./faq.md)** - Common questions
- **[GitHub Issues](https://github.com/subculture-collective/internet-id/issues)** - Report bugs
- **Discord** - Community support
- **Email** - support@internet-id.io

Found a bug? [Report it](https://github.com/subculture-collective/internet-id/issues/new?template=bug_report.md)!
