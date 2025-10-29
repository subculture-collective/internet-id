# Badge API Documentation

This document provides comprehensive documentation for the Internet ID badge generation API, which allows you to create embeddable verification badges for your verified content.

## Overview

The Badge API enables you to:
- Generate SVG badges with verification status
- Customize badge appearance (theme, size, style)
- Get embed codes for HTML and Markdown
- Check verification status
- Display badges on external websites and platforms

## Base URL

All API endpoints are relative to your API base URL:
- Development: `http://localhost:3001`
- Production: Set via `NEXT_PUBLIC_API_BASE` environment variable

## Endpoints

### 1. Generate SVG Badge

Generate an SVG badge for a content hash with customizable appearance.

**Endpoint:** `GET /api/badge/:hash/svg`

**Parameters:**

| Parameter | Type | Options | Default | Description |
|-----------|------|---------|---------|-------------|
| `theme` | string | `dark`, `light`, `blue`, `green`, `purple` | `dark` | Color theme for the badge |
| `size` | string \| number | `small`, `medium`, `large`, or `120-640` | `medium` | Badge width in pixels |
| `style` | string | `flat`, `rounded`, `pill`, `minimal` | `rounded` | Badge shape style |
| `showTimestamp` | boolean | `true`, `false` | `false` | Display verification timestamp |
| `showPlatform` | boolean | `true`, `false` | `false` | Display platform name |
| `platform` | string | Any platform name | - | Override platform display name |

**Size Presets:**
- `small`: 180px
- `medium`: 240px
- `large`: 320px
- Custom: Any value between 120-640 pixels

**Example Requests:**

```bash
# Basic dark badge
GET /api/badge/0x1234.../svg

# Light theme, large size, pill style
GET /api/badge/0x1234.../svg?theme=light&size=large&style=pill

# Custom width with timestamp
GET /api/badge/0x1234.../svg?size=300&showTimestamp=true

# Blue theme with platform info
GET /api/badge/0x1234.../svg?theme=blue&showPlatform=true
```

**Response:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="32" role="img" aria-label="Verified: 0x1234...">
  <title>Verified on-chain: 0x1234...</title>
  <rect rx="6" width="240" height="32" fill="#0b0f1a" stroke="#0cf" stroke-width="0.5"/>
  <text x="10" y="21" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" fill="#9ef" font-weight="500">✓ Verified · 0x1234...567890</text>
</svg>
```

**Cache:** Badges are cached for 1 hour with `Cache-Control: public, max-age=3600`

---

### 2. Get Embed Codes

Get pre-generated HTML and Markdown embed codes for a badge.

**Endpoint:** `GET /api/badge/:hash/embed`

**Query Parameters:**
- Same as SVG endpoint (theme, size, style)

**Example Request:**

```bash
GET /api/badge/0x1234.../embed?theme=dark&size=medium
```

**Response:**

```json
{
  "html": "<a href=\"https://your-site.com/verify?hash=0x1234...\" target=\"_blank\" rel=\"noopener noreferrer\">\n  <img src=\"https://your-site.com/api/badge/0x1234.../svg?theme=dark&size=medium\" alt=\"Verified content 0x1234...\" />\n</a>",
  "markdown": "[![Verified content 0x1234...](https://your-site.com/api/badge/0x1234.../svg?theme=dark&size=medium)](https://your-site.com/verify?hash=0x1234...)",
  "direct": "https://your-site.com/api/badge/0x1234.../svg?theme=dark&size=medium",
  "verify": "https://your-site.com/verify?hash=0x1234...",
  "contentHash": "0x1234..."
}
```

---

### 3. Check Badge Status

Get verification status for a content hash without generating a badge.

**Endpoint:** `GET /api/badge/:hash/status`

**Example Request:**

```bash
GET /api/badge/0x1234.../status
```

**Response:**

```json
{
  "contentHash": "0x1234567890abcdef...",
  "verified": true,
  "timestamp": "2025-10-29T12:00:00.000Z",
  "platforms": ["youtube", "twitter"],
  "creator": "0xABC...",
  "registryAddress": "0xDEF..."
}
```

**Cache:** Status is cached for 5 minutes with automatic invalidation on updates.

---

### 4. Get Badge Options

List all available customization options.

**Endpoint:** `GET /api/badge/options`

**Example Request:**

```bash
GET /api/badge/options
```

**Response:**

```json
{
  "themes": ["dark", "light", "blue", "green", "purple"],
  "sizes": ["small", "medium", "large", "custom (120-640)"],
  "styles": ["flat", "rounded", "pill", "minimal"],
  "customization": {
    "showTimestamp": "boolean",
    "showPlatform": "boolean",
    "platform": "string (platform name)"
  },
  "examples": [
    "/api/badge/{hash}/svg?theme=dark&size=medium&style=rounded",
    "/api/badge/{hash}/svg?theme=light&size=large&style=pill",
    "/api/badge/{hash}/svg?theme=blue&size=small&style=flat&showTimestamp=true"
  ]
}
```

---

### 5. PNG Badge (Redirect)

**Endpoint:** `GET /api/badge/:hash/png`

**Note:** Currently redirects to the SVG endpoint. PNG conversion can be implemented if needed.

---

## Theme Options

### Dark (Default)
- Background: `#0b0f1a`
- Foreground: `#9ef`
- Accent: `#0cf`

### Light
- Background: `#ffffff`
- Foreground: `#0b0f1a`
- Accent: `#0080ff`

### Blue
- Background: `#1a237e`
- Foreground: `#e3f2fd`
- Accent: `#64b5f6`

### Green
- Background: `#1b5e20`
- Foreground: `#e8f5e9`
- Accent: `#81c784`

### Purple
- Background: `#4a148c`
- Foreground: `#f3e5f5`
- Accent: `#ba68c8`

---

## Style Options

### Flat
- No border radius
- Sharp corners
- Clean, modern look

### Rounded (Default)
- 6px border radius (scaled with size)
- Soft corners
- Balanced appearance

### Pill
- Border radius equals half of height
- Fully rounded ends
- Distinctive, modern style

### Minimal
- Only shows verification checkmark
- No hash display
- Compact design

---

## Embedding Instructions

### HTML

```html
<!-- Basic embed -->
<a href="https://your-site.com/verify?hash=0x1234...">
  <img src="https://your-site.com/api/badge/0x1234.../svg" alt="Verified on Internet ID" />
</a>

<!-- With custom styling -->
<a href="https://your-site.com/verify?hash=0x1234..." style="display: inline-block;">
  <img 
    src="https://your-site.com/api/badge/0x1234.../svg?theme=blue&size=large" 
    alt="Verified on Internet ID" 
    style="vertical-align: middle;"
  />
</a>
```

### Markdown

```markdown
<!-- Basic embed -->
[![Verified on Internet ID](https://your-site.com/api/badge/0x1234.../svg)](https://your-site.com/verify?hash=0x1234...)

<!-- With custom theme -->
[![Verified on Internet ID](https://your-site.com/api/badge/0x1234.../svg?theme=light&style=pill)](https://your-site.com/verify?hash=0x1234...)
```

### React Component

```tsx
import React from 'react';

interface BadgeProps {
  hash: string;
  theme?: 'dark' | 'light' | 'blue' | 'green' | 'purple';
  size?: 'small' | 'medium' | 'large' | number;
  style?: 'flat' | 'rounded' | 'pill' | 'minimal';
  showTimestamp?: boolean;
}

export function VerificationBadge({ 
  hash, 
  theme = 'dark', 
  size = 'medium',
  style = 'rounded',
  showTimestamp = false 
}: BadgeProps) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
  const siteBase = process.env.NEXT_PUBLIC_SITE_BASE || window.location.origin;
  
  const params = new URLSearchParams();
  params.set('theme', theme);
  params.set('size', String(size));
  params.set('style', style);
  if (showTimestamp) params.set('showTimestamp', 'true');
  
  const badgeUrl = `${apiBase}/api/badge/${hash}/svg?${params.toString()}`;
  const verifyUrl = `${siteBase}/verify?hash=${hash}`;
  
  return (
    <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
      <img src={badgeUrl} alt="Verified on Internet ID" />
    </a>
  );
}
```

### Vanilla JavaScript

```javascript
// Create and insert a badge dynamically
function createBadge(hash, options = {}) {
  const {
    theme = 'dark',
    size = 'medium',
    style = 'rounded',
    container = document.body
  } = options;
  
  const apiBase = 'http://localhost:3001';
  const siteBase = window.location.origin;
  
  const params = new URLSearchParams({ theme, size, style });
  const badgeUrl = `${apiBase}/api/badge/${hash}/svg?${params.toString()}`;
  const verifyUrl = `${siteBase}/verify?hash=${hash}`;
  
  const link = document.createElement('a');
  link.href = verifyUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  
  const img = document.createElement('img');
  img.src = badgeUrl;
  img.alt = 'Verified on Internet ID';
  
  link.appendChild(img);
  container.appendChild(link);
  
  return link;
}

// Usage
createBadge('0x1234...', { 
  theme: 'blue', 
  size: 'large',
  container: document.getElementById('badge-container')
});
```

---

## Caching Strategy

The Badge API implements a multi-layer caching strategy for optimal performance:

### Server-Side Cache
- **Cache Backend:** Redis (when available)
- **Badge SVG Cache:** 10 minutes
- **Status Cache:** 5 minutes
- **Automatic Invalidation:** On content updates

### Client-Side Cache
- **Cache-Control Header:** `public, max-age=3600`
- **CDN Compatible:** Badges can be cached by CDNs
- **Versioning:** Change query params to bust cache

### Cache Keys
```
badge:svg:{hash}:{options}     # SVG badge with specific options
badge:status:{hash}            # Verification status
```

---

## Rate Limiting

Badge endpoints use **moderate** rate limiting:
- Suitable for public badge display
- Designed for high-traffic scenarios
- No API key required for badge generation

---

## Best Practices

### 1. Use Appropriate Sizes
- **Small (180px):** Social media avatars, inline text
- **Medium (240px):** Blog posts, documentation (default)
- **Large (320px):** Hero sections, feature highlights
- **Custom:** Match your design requirements

### 2. Choose the Right Theme
- **Dark:** Best for dark backgrounds
- **Light:** Best for light backgrounds
- **Blue/Green/Purple:** Brand-specific themes

### 3. Cache Badges Locally
- Use CDN for high-traffic sites
- Cache badges on your server if needed
- Respect cache headers

### 4. Handle Unverified Content
- Check badge status before embedding
- Display appropriate messaging for unverified content
- Consider fallback badges

### 5. Accessibility
- Always include descriptive `alt` text
- Ensure sufficient color contrast
- Use semantic HTML (links to verification)

---

## Examples

### Basic Implementation

```html
<!-- Simple badge for verified content -->
<img src="https://api.internet-id.com/api/badge/0x1234.../svg" alt="Verified" />
```

### With Verification Link

```html
<a href="https://internet-id.com/verify?hash=0x1234..." target="_blank">
  <img src="https://api.internet-id.com/api/badge/0x1234.../svg?theme=blue" alt="View verification" />
</a>
```

### Responsive Badge

```html
<picture>
  <source media="(max-width: 768px)" srcset="https://api.internet-id.com/api/badge/0x1234.../svg?size=small">
  <source media="(min-width: 769px)" srcset="https://api.internet-id.com/api/badge/0x1234.../svg?size=large">
  <img src="https://api.internet-id.com/api/badge/0x1234.../svg" alt="Verified on Internet ID">
</picture>
```

---

## Troubleshooting

### Badge Not Displaying
1. Check that the content hash is valid
2. Verify the API base URL is correct
3. Ensure CORS is properly configured
4. Check browser console for errors

### Badge Shows "Unverified"
1. Verify content is actually registered on-chain
2. Check that the hash matches registered content
3. Allow time for cache refresh (5 minutes)

### Styling Issues
1. Use appropriate size for container
2. Check that SVG images are allowed by CSP
3. Verify theme matches your design

---

## Support

For additional support or questions:
- View the badge showcase: `/badges`
- Check the main documentation: `README.md`
- Open an issue on GitHub

---

## Security Considerations

- Badges are publicly accessible (no authentication required)
- Badge URLs are safe to embed in public websites
- Content hash is displayed but no sensitive data is exposed
- Verification links point to public verification page
- XSS protection: All user input is sanitized

---

## Future Enhancements

Potential future additions:
- PNG badge generation (with server-side rendering)
- Animated badges for special content
- Custom badge templates
- Badge analytics (view counts)
- Dynamic QR codes in badges
- Social media platform-specific formats
