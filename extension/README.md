# Internet ID Browser Extension

A browser extension for seamless verification of human-created content across multiple platforms.

## Features

- ✅ **Platform Detection**: Automatically detects YouTube, Twitter/X, Instagram, GitHub, TikTok, and LinkedIn
- ✅ **One-Click Verification**: Instantly verify content without leaving the platform
- ✅ **Visual Badges**: Display verification status directly on platform pages
- ✅ **Quick Access Popup**: Check verification status with a single click
- ✅ **Wallet Integration**: Connect your wallet for content registration
- ✅ **Privacy-Conscious**: Configurable auto-verify and caching settings
- ✅ **Multi-Browser Support**: Designed for Chrome, Firefox, and Safari (Chromium-based browsers initially)

## Installation

### Development Installation (Chrome/Edge/Brave)

1. Clone the repository and navigate to the extension directory:

   ```bash
   cd /path/to/internet-id/extension
   ```

2. Open Chrome/Edge/Brave and navigate to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the `extension` directory

5. The Internet ID Verifier extension should now be installed!

### Production Installation

Once published to the Chrome Web Store:

1. Visit the [Chrome Web Store listing](#) (coming soon)
2. Click "Add to Chrome"
3. Confirm installation

## Configuration

### First-Time Setup

1. Click the extension icon in your browser toolbar
2. Click "Settings" to open the options page
3. Configure your API settings:
   - **API Base URL**: Your Internet ID API server URL (default: `http://localhost:3001`)
   - **API Key**: Optional API key if your server requires authentication

### Settings Overview

#### API Configuration

- **API Base URL**: The URL of your Internet ID API server
- **API Key**: Optional authentication key for protected API endpoints
- **Test Connection**: Verify your API configuration is working

#### Verification Settings

- **Auto-verify content**: Automatically check verification status on supported platforms
- **Show verification badges**: Display badges directly on platform pages
- **Enable notifications**: Show desktop notifications for verification status

#### Appearance

- **Theme**: Choose between Light, Dark, or Auto (system preference)

#### Wallet Connection

- **Connect Wallet**: Link your MetaMask or other Web3 wallet for signing operations
- Enables one-click content registration and verification

#### Privacy & Data

- **Clear Cache**: Remove cached verification results (5-minute cache)
- **Reset Settings**: Restore all settings to default values

## Usage

### Checking Verification Status

#### Method 1: Automatic (Recommended)

1. Enable "Auto-verify content" in settings
2. Visit a supported platform (YouTube, Twitter, etc.)
3. Look for the verification badge on verified content

#### Method 2: Manual Check

1. Visit any page on a supported platform
2. Click the extension icon
3. View verification status in the popup

### Verifying New Content

1. Visit the content you want to verify
2. Click the extension icon
3. If not verified, click "Verify Now"
4. Follow the instructions in the dashboard

### Supported Platforms

| Platform  | Detection | Badge Display | Status      |
| --------- | --------- | ------------- | ----------- |
| YouTube   | ✅        | ✅            | Implemented |
| Twitter/X | ✅        | ✅            | Implemented |
| Instagram | ✅        | 🚧            | Placeholder |
| GitHub    | ✅        | 🚧            | Placeholder |
| TikTok    | ✅        | 🚧            | Placeholder |
| LinkedIn  | ✅        | 🚧            | Placeholder |

## Architecture

### Extension Components

```
extension/
├── manifest.json           # Extension configuration
├── src/
│   ├── background/
│   │   └── service-worker.js    # Background tasks, messaging
│   ├── content/
│   │   ├── youtube.js           # YouTube content script
│   │   ├── twitter.js           # Twitter/X content script
│   │   ├── instagram.js         # Instagram content script
│   │   ├── github.js            # GitHub content script
│   │   ├── tiktok.js            # TikTok content script
│   │   ├── linkedin.js          # LinkedIn content script
│   │   └── styles.css           # Badge styles
│   ├── popup/
│   │   ├── popup.html           # Extension popup UI
│   │   ├── popup.css            # Popup styles
│   │   └── popup.js             # Popup logic
│   ├── options/
│   │   ├── options.html         # Settings page
│   │   ├── options.css          # Settings styles
│   │   └── options.js           # Settings logic
│   └── utils/
│       ├── platform-detector.js # Platform detection
│       ├── api-client.js        # API communication
│       └── storage.js           # Settings storage
└── public/
    └── icons/                   # Extension icons
```

### Communication Flow

1. **Content Script** detects platform and content ID
2. **Background Worker** receives verification request
3. **API Client** queries Internet ID API
4. **Cache** stores results for 5 minutes
5. **Badge** displays on page if verified

## Development

### Prerequisites

- Chrome/Chromium-based browser (v88+)
- Internet ID API server running (see main README)
- Node.js (for development tools, optional)

### Local Development

1. Make changes to extension files
2. Reload extension in browser:
   - Go to `chrome://extensions`
   - Click reload icon for Internet ID Verifier
3. Test changes on supported platforms

### Testing

#### Manual Testing Checklist

- [ ] Install extension in clean browser profile
- [ ] Configure API settings
- [ ] Test on YouTube video page
- [ ] Test on Twitter/X post
- [ ] Verify popup displays correct status
- [ ] Test settings persistence
- [ ] Test wallet connection
- [ ] Verify badge displays correctly
- [ ] Test cache clearing
- [ ] Test settings reset

#### Platform-Specific Testing

**YouTube:**

- Navigate to a verified video
- Check for verification badge below title
- Hover over badge to see tooltip
- Verify extension badge shows checkmark

**Twitter/X:**

- Navigate to a verified tweet
- Check for verification badge on tweet
- Test with both old and new URLs (twitter.com vs x.com)

### Build for Production

For Chrome Web Store submission:

1. Test extension thoroughly
2. Update version in `manifest.json`
3. Create ZIP file of extension directory:
   ```bash
   cd extension
   zip -r internet-id-extension-v1.0.0.zip . -x "*.git*" -x "*.DS_Store"
   ```
4. Submit to Chrome Web Store Developer Dashboard

### Firefox Support

To adapt for Firefox:

1. Update `manifest.json` to Manifest V2 (Firefox requirement)
2. Change `service_worker` to `background.scripts`
3. Update `action` to `browser_action`
4. Test in Firefox
5. Submit to Firefox Add-ons

### Safari Support

Safari requires:

1. Use Xcode to convert extension
2. Build Safari App Extension
3. Sign with Apple Developer certificate
4. Submit to App Store

## Privacy & Permissions

### Required Permissions

- **storage**: Save settings and cache verification results
- **activeTab**: Access current page URL for verification
- **scripting**: Inject badges on platform pages

### Host Permissions

Access to supported platforms for content script injection:

- `https://youtube.com/*`
- `https://www.youtube.com/*`
- `https://twitter.com/*`
- `https://x.com/*`
- `https://instagram.com/*`
- `https://www.instagram.com/*`
- `https://github.com/*`
- `https://www.tiktok.com/*`
- `https://linkedin.com/*`
- `https://www.linkedin.com/*`

### Data Collection

The extension:

- ✅ Does NOT collect personal information
- ✅ Does NOT track browsing history
- ✅ Only sends verification requests to configured API
- ✅ Caches results locally for 5 minutes
- ✅ Stores settings locally in browser

## Troubleshooting

### Extension Not Working

1. Check that API server is running
2. Verify API Base URL in settings
3. Test API connection in settings
4. Check browser console for errors (F12 → Console)

### Badge Not Showing

1. Ensure "Show verification badges" is enabled
2. Refresh the page
3. Check if content is actually verified
4. Look for errors in console

### Verification Always Fails

1. Test API connection in settings
2. Check API key (if required)
3. Verify API server is accessible
4. Check network tab for failed requests

### Wallet Connection Issues

1. Install MetaMask or another Web3 wallet
2. Allow extension to connect
3. Check wallet is on correct network
4. Try disconnecting and reconnecting

## Contributing

Contributions are welcome! Please see the main repository [CONTRIBUTING.md](../docs/CONTRIBUTING.md).

### Areas for Contribution

- Complete platform implementations (Instagram, GitHub, TikTok, LinkedIn)
- Improve badge styling and positioning
- Add more wallet providers
- Firefox and Safari ports
- Internationalization (i18n)
- Accessibility improvements

## License

MIT License - see [LICENSE](../LICENSE) for details

## Support

- GitHub Issues: [Report a bug](https://github.com/subculture-collective/internet-id/issues)
- Documentation: [Main README](../README.md)
- Security: [Security Policy](../SECURITY_POLICY.md)

## Roadmap

- [x] Chrome/Chromium support (Manifest V3)
- [x] YouTube verification
- [x] Twitter/X verification
- [ ] Complete Instagram implementation
- [ ] Complete GitHub implementation
- [ ] Complete TikTok implementation
- [ ] Complete LinkedIn implementation
- [ ] Firefox port
- [ ] Safari port
- [ ] Chrome Web Store publication
- [ ] Firefox Add-ons publication
- [ ] Safari Extensions publication
- [ ] Usage analytics dashboard
- [ ] Error reporting integration
- [ ] Internationalization (i18n)
