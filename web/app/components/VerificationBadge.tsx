'use client';

import React from 'react';

/**
 * VerificationBadge Component
 * 
 * A reusable React component for displaying verification badges.
 * Supports customization of theme, size, style, and additional options.
 */

export interface VerificationBadgeProps {
  /** Content hash to display badge for */
  hash: string;
  /** Badge color theme */
  theme?: 'dark' | 'light' | 'blue' | 'green' | 'purple';
  /** Badge size preset or custom width in pixels */
  size?: 'small' | 'medium' | 'large' | number;
  /** Badge visual style */
  style?: 'flat' | 'rounded' | 'pill' | 'minimal';
  /** Show verification timestamp */
  showTimestamp?: boolean;
  /** Show platform name */
  showPlatform?: boolean;
  /** Override platform name */
  platform?: string;
  /** Additional CSS classes */
  className?: string;
  /** Link to verification page (if not provided, uses default) */
  verifyUrl?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Whether to make the badge clickable */
  clickable?: boolean;
}

/**
 * VerificationBadge component that renders a verification badge image
 * with optional link to verification page.
 */
export function VerificationBadge({
  hash,
  theme = 'dark',
  size = 'medium',
  style = 'rounded',
  showTimestamp = false,
  showPlatform = false,
  platform,
  className = '',
  verifyUrl,
  alt = 'Verified on Internet ID',
  clickable = true,
}: VerificationBadgeProps) {
  // Build badge URL
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
  const params = new URLSearchParams();
  
  params.set('theme', theme);
  params.set('size', String(size));
  params.set('style', style);
  if (showTimestamp) params.set('showTimestamp', 'true');
  if (showPlatform) params.set('showPlatform', 'true');
  if (platform) params.set('platform', platform);
  
  const badgeUrl = `${apiBase}/api/badge/${hash}/svg?${params.toString()}`;
  
  // Build verification URL
  const siteBase = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_SITE_BASE || window.location.origin)
    : (process.env.NEXT_PUBLIC_SITE_BASE || 'http://localhost:3000');
  const defaultVerifyUrl = `${siteBase}/verify?hash=${hash}`;
  const targetUrl = verifyUrl || defaultVerifyUrl;
  
  // Badge image element
  const badgeImg = (
    <img
      src={badgeUrl}
      alt={alt}
      className={className}
      style={{ display: 'inline-block' }}
    />
  );
  
  // Wrap in link if clickable
  if (clickable) {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-block', textDecoration: 'none' }}
      >
        {badgeImg}
      </a>
    );
  }
  
  return badgeImg;
}

/**
 * Hook to get badge URL and embed codes
 */
export function useBadgeUrls(hash: string, options: Omit<VerificationBadgeProps, 'hash'> = {}) {
  const {
    theme = 'dark',
    size = 'medium',
    style = 'rounded',
    showTimestamp = false,
    showPlatform = false,
    platform,
  } = options;
  
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
  const siteBase = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_SITE_BASE || window.location.origin)
    : (process.env.NEXT_PUBLIC_SITE_BASE || 'http://localhost:3000');
  
  const params = new URLSearchParams();
  params.set('theme', theme);
  params.set('size', String(size));
  params.set('style', style);
  if (showTimestamp) params.set('showTimestamp', 'true');
  if (showPlatform) params.set('showPlatform', 'true');
  if (platform) params.set('platform', platform);
  
  const badgeUrl = `${apiBase}/api/badge/${hash}/svg?${params.toString()}`;
  const verifyUrl = `${siteBase}/verify?hash=${hash}`;
  
  const html = `<a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">
  <img src="${badgeUrl}" alt="Verified on Internet ID" />
</a>`;
  
  const markdown = `[![Verified on Internet ID](${badgeUrl})](${verifyUrl})`;
  
  return {
    badgeUrl,
    verifyUrl,
    html,
    markdown,
  };
}

/**
 * Example usage:
 * 
 * ```tsx
 * import { VerificationBadge } from '@/app/components/VerificationBadge';
 * 
 * function MyComponent() {
 *   return (
 *     <div>
 *       <VerificationBadge 
 *         hash="0x1234..." 
 *         theme="blue" 
 *         size="large"
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
