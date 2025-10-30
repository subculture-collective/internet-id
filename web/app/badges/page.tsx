'use client';

import { useState } from 'react';

/**
 * Badge Showcase/Gallery Page
 * 
 * Displays example badges with different configurations and provides
 * interactive preview and customization options.
 */

const EXAMPLE_HASH = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

interface BadgeConfig {
  theme: string;
  size: string;
  style: string;
  showTimestamp?: boolean;
  showPlatform?: boolean;
}

export default function BadgesPage() {
  const [customConfig, setCustomConfig] = useState<BadgeConfig>({
    theme: 'dark',
    size: 'medium',
    style: 'rounded',
  });

  const [copied, setCopied] = useState<string | null>(null);

  const exampleBadges = [
    { theme: 'dark', size: 'small', style: 'rounded', label: 'Dark Small Rounded' },
    { theme: 'light', size: 'medium', style: 'rounded', label: 'Light Medium Rounded' },
    { theme: 'blue', size: 'large', style: 'pill', label: 'Blue Large Pill' },
    { theme: 'green', size: 'medium', style: 'flat', label: 'Green Medium Flat' },
    { theme: 'purple', size: 'small', style: 'minimal', label: 'Purple Small Minimal' },
    { theme: 'dark', size: 'large', style: 'rounded', label: 'Dark Large Rounded' },
  ];

  const buildBadgeUrl = (config: BadgeConfig) => {
    const params = new URLSearchParams();
    params.set('theme', config.theme);
    params.set('size', config.size);
    params.set('style', config.style);
    if (config.showTimestamp) params.set('showTimestamp', 'true');
    if (config.showPlatform) params.set('showPlatform', 'true');
    
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
    return `${apiBase}/api/badge/${EXAMPLE_HASH}/svg?${params.toString()}`;
  };

  const buildEmbedCode = (config: BadgeConfig) => {
    const badgeUrl = buildBadgeUrl(config);
    const siteBase = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_SITE_BASE || window.location.origin)
      : (process.env.NEXT_PUBLIC_SITE_BASE || 'http://localhost:3000');
    const verifyUrl = `${siteBase}/verify?hash=${EXAMPLE_HASH}`;
    
    return {
      html: `<a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">
  <img src="${badgeUrl}" alt="Verified on Internet ID" />
</a>`,
      markdown: `[![Verified on Internet ID](${badgeUrl})](${verifyUrl})`,
      direct: badgeUrl,
    };
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const embedCodes = buildEmbedCode(customConfig);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Verification Badges
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Embeddable badges to showcase your verified content on any platform.
            Choose from multiple themes, sizes, and styles.
          </p>
        </div>

        {/* Example Gallery */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Badge Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exampleBadges.map((badge, idx) => (
              <div
                key={idx}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
              >
                <h3 className="text-lg font-semibold mb-4 text-center">{badge.label}</h3>
                <div className="flex justify-center items-center h-24 bg-gray-900 rounded-md">
                  <img
                    src={buildBadgeUrl(badge)}
                    alt={badge.label}
                    className="max-w-full max-h-full"
                  />
                </div>
                <div className="mt-4 text-sm text-gray-400 text-center">
                  <p>Theme: {badge.theme}</p>
                  <p>Size: {badge.size}</p>
                  <p>Style: {badge.style}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Customizer */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Badge Customizer</h2>
          
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            {/* Preview */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Preview</h3>
              <div className="flex justify-center items-center h-32 bg-gray-900 rounded-md">
                <img
                  src={buildBadgeUrl(customConfig)}
                  alt="Custom badge preview"
                  className="max-w-full max-h-full"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Theme */}
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  value={customConfig.theme}
                  onChange={(e) => setCustomConfig({ ...customConfig, theme: e.target.value })}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium mb-2">Size</label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  value={customConfig.size}
                  onChange={(e) => setCustomConfig({ ...customConfig, size: e.target.value })}
                >
                  <option value="small">Small (180px)</option>
                  <option value="medium">Medium (240px)</option>
                  <option value="large">Large (320px)</option>
                </select>
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium mb-2">Style</label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  value={customConfig.style}
                  onChange={(e) => setCustomConfig({ ...customConfig, style: e.target.value })}
                >
                  <option value="flat">Flat</option>
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              {/* Show Timestamp */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showTimestamp"
                  className="mr-2"
                  checked={customConfig.showTimestamp || false}
                  onChange={(e) =>
                    setCustomConfig({ ...customConfig, showTimestamp: e.target.checked })
                  }
                />
                <label htmlFor="showTimestamp" className="text-sm">
                  Show Timestamp
                </label>
              </div>

              {/* Show Platform */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPlatform"
                  className="mr-2"
                  checked={customConfig.showPlatform || false}
                  onChange={(e) =>
                    setCustomConfig({ ...customConfig, showPlatform: e.target.checked })
                  }
                />
                <label htmlFor="showPlatform" className="text-sm">
                  Show Platform
                </label>
              </div>
            </div>

            {/* Embed Codes */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Embed Code</h3>

              {/* HTML */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">HTML</label>
                  <button
                    onClick={() => copyToClipboard(embedCodes.html, 'html')}
                    className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                  >
                    {copied === 'html' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                  <code>{embedCodes.html}</code>
                </pre>
              </div>

              {/* Markdown */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Markdown</label>
                  <button
                    onClick={() => copyToClipboard(embedCodes.markdown, 'markdown')}
                    className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                  >
                    {copied === 'markdown' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                  <code>{embedCodes.markdown}</code>
                </pre>
              </div>

              {/* Direct URL */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Direct Badge URL</label>
                  <button
                    onClick={() => copyToClipboard(embedCodes.direct, 'direct')}
                    className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                  >
                    {copied === 'direct' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                  <code>{embedCodes.direct}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Documentation */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Documentation</h2>
          
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 prose prose-invert max-w-none">
            <h3 className="text-xl font-semibold mb-4">API Endpoints</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <code className="bg-gray-900 px-2 py-1 rounded">
                  GET /api/badge/:hash/svg
                </code>
                <p className="mt-2 text-gray-300">
                  Generate an SVG badge for a content hash. Supports query parameters for theme, size, style, and more.
                </p>
              </div>

              <div>
                <code className="bg-gray-900 px-2 py-1 rounded">
                  GET /api/badge/:hash/embed
                </code>
                <p className="mt-2 text-gray-300">
                  Get pre-generated HTML and Markdown embed codes for a badge.
                </p>
              </div>

              <div>
                <code className="bg-gray-900 px-2 py-1 rounded">
                  GET /api/badge/:hash/status
                </code>
                <p className="mt-2 text-gray-300">
                  Get verification status for a content hash without generating a badge.
                </p>
              </div>

              <div>
                <code className="bg-gray-900 px-2 py-1 rounded">
                  GET /api/badge/options
                </code>
                <p className="mt-2 text-gray-300">
                  List all available customization options for badges.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-4">Query Parameters</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-3">Parameter</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Options</th>
                    <th className="text-left py-2 px-3">Default</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-3"><code>theme</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">dark, light, blue, green, purple</td>
                    <td className="py-2 px-3">dark</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-3"><code>size</code></td>
                    <td className="py-2 px-3">string | number</td>
                    <td className="py-2 px-3">small, medium, large, or 120-640</td>
                    <td className="py-2 px-3">medium</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-3"><code>style</code></td>
                    <td className="py-2 px-3">string</td>
                    <td className="py-2 px-3">flat, rounded, pill, minimal</td>
                    <td className="py-2 px-3">rounded</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-3"><code>showTimestamp</code></td>
                    <td className="py-2 px-3">boolean</td>
                    <td className="py-2 px-3">true, false</td>
                    <td className="py-2 px-3">false</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 px-3"><code>showPlatform</code></td>
                    <td className="py-2 px-3">boolean</td>
                    <td className="py-2 px-3">true, false</td>
                    <td className="py-2 px-3">false</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Integration Examples */}
        <section>
          <h2 className="text-3xl font-bold mb-6 text-center">Integration Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vanilla JS */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Vanilla JavaScript</h3>
              <pre className="bg-gray-900 p-4 rounded text-xs overflow-x-auto">
                <code>{`// Dynamically insert a badge
const hash = 'your-content-hash';
const img = document.createElement('img');
img.src = \`/api/badge/\${hash}/svg?theme=dark\`;
img.alt = 'Verified on Internet ID';
document.getElementById('badge-container').appendChild(img);`}</code>
              </pre>
            </div>

            {/* React */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">React Component</h3>
              <pre className="bg-gray-900 p-4 rounded text-xs overflow-x-auto">
                <code>{`function Badge({ hash, theme = 'dark' }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const badgeUrl = \`\${apiBase}/api/badge/\${hash}/svg?theme=\${theme}\`;
  const verifyUrl = \`/verify?hash=\${hash}\`;
  
  return (
    <a href={verifyUrl}>
      <img src={badgeUrl} alt="Verified" />
    </a>
  );
}`}</code>
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
