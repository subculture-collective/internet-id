# Extension Icons

Place the extension icons in this directory:

- `icon16.png` - 16x16 pixels (toolbar, context menu)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store, installation)

## Design Guidelines

- Use the Internet ID brand colors (purple gradient: #667eea to #764ba2)
- Include a checkmark or verification symbol
- Keep design simple and recognizable at small sizes
- Use transparent background (PNG)
- Follow platform-specific guidelines:
  - Chrome Web Store: https://developer.chrome.com/docs/webstore/images/
  - Firefox Add-ons: https://extensionworkshop.com/documentation/develop/branding/

## Generating Icons

You can use an online tool or image editor to create icons from an SVG:

1. Create SVG design (512x512 recommended)
2. Export to PNG at required sizes
3. Optimize with tools like TinyPNG or ImageOptim

For now, the extension will work without icons (browser will show default icon).
