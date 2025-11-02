import { fileURLToPath } from "url";
import path from "path";
import createNextIntlPlugin from 'next-intl/plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bundle analyzer - run with ANALYZE=true npm run build
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Initialize next-intl plugin
const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Docker support: Enable standalone output for optimized production builds
  output: 'standalone',
  
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
  
  // Production bundle optimizations
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  
  // Enable strict mode for better performance
  experimental: {
    optimizePackageImports: ['qrcode'],
  },
  
  // During build, lint but don't fail on pre-existing warnings/errors
  // This allows gradual ESLint adoption while still catching new issues in CI
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Fix errors and remove this option.
    ignoreDuringBuilds: true,
  },
  
  // Configure headers for better caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://ipfs.io https://*.ipfs.io https://gateway.pinata.cloud https://*.mypinata.cloud https://cloudflare-ipfs.com https://dweb.link",
              "font-src 'self' data:",
              "connect-src 'self' https://*.infura.io https://*.alchemy.com https://*.quicknode.pro https://rpc.ankr.com https://cloudflare-eth.com https://polygon-rpc.com https://rpc-mainnet.matic.network https://rpc-mainnet.maticvigil.com https://mainnet.base.org https://base.llamarpc.com https://arb1.arbitrum.io https://arbitrum.llamarpc.com https://mainnet.optimism.io https://optimism.llamarpc.com https://ipfs.io https://gateway.pinata.cloud",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
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

export default withNextIntl(withBundleAnalyzer(nextConfig));
