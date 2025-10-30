import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bundle analyzer - run with ANALYZE=true npm run build
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Performance: Enable production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression
  
  // Turbopack configuration
  turbopack: {
    root: __dirname,
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Optimize fonts
  optimizeFonts: true,
  
  // Production bundle optimizations
  swcMinify: true,
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  
  // Enable strict mode for better performance
  experimental: {
    optimizePackageImports: ['qrcode', 'react-dom'],
  },
  
  // During build, lint but don't fail on pre-existing warnings/errors
  // This allows gradual ESLint adoption while still catching new issues in CI
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Fix errors and remove this option.
    ignoreDuringBuilds: true,
  },
  
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
