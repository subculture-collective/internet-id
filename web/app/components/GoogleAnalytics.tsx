"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

interface GoogleAnalyticsProps {
  nonce?: string;
}

/**
 * Google Analytics 4 (GA4) component with consent mode support
 * 
 * To enable:
 * 1. Add NEXT_PUBLIC_GA_MEASUREMENT_ID to your .env.local file
 * 2. Import and add this component to your root layout
 * 
 * Example:
 * NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 * 
 * See docs/SEO_ANALYTICS_SETUP.md for full setup instructions.
 * 
 * This component integrates with the CookieConsent component to respect
 * user consent preferences. Analytics will only track when consent is granted.
 */
export default function GoogleAnalytics({ nonce }: GoogleAnalyticsProps) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    // Check initial consent from localStorage
    const savedConsent = localStorage.getItem("cookie_consent");
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        setConsentGranted(parsed.analytics === true);
      } catch (e) {
        console.error("Failed to parse consent:", e);
      }
    }

    // Listen for consent changes
    const handleConsentChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setConsentGranted(detail.analytics === true);
    };

    window.addEventListener("cookieConsentChanged", handleConsentChange as EventListener);
    return () => {
      window.removeEventListener("cookieConsentChanged", handleConsentChange as EventListener);
    };
  }, []);

  if (!measurementId) {
    // Analytics not configured - this is fine for development
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        nonce={nonce}
      />
      <Script id="google-analytics" strategy="afterInteractive" nonce={nonce}>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          
          // Set default consent state (denied by default, waiting for user choice)
          gtag('consent', 'default', {
            'analytics_storage': 'denied'
          });
          
          gtag('js', new Date());
          
          gtag('config', ${JSON.stringify(measurementId)}, {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      {consentGranted && (
        <Script id="google-analytics-consent-granted" strategy="afterInteractive" nonce={nonce}>
          {`
            if (window.gtag) {
              gtag('consent', 'update', {
                'analytics_storage': 'granted'
              });
            }
          `}
        </Script>
      )}
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
