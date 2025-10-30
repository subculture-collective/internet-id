"use client";

import Script from "next/script";

/**
 * Google Analytics 4 (GA4) component
 * 
 * To enable:
 * 1. Add NEXT_PUBLIC_GA_MEASUREMENT_ID to your .env.local file
 * 2. Import and add this component to your root layout
 * 
 * Example:
 * NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 * 
 * See docs/SEO_ANALYTICS_SETUP.md for full setup instructions.
 */
export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!measurementId) {
    // Analytics not configured - this is fine for development
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

/**
 * Helper function to track custom events
 * 
 * Usage:
 * import { trackEvent } from './components/GoogleAnalytics';
 * 
 * trackEvent('verification_complete', {
 *   content_hash: contentHash,
 *   platform: platform,
 * });
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, eventParams);
  }
}
