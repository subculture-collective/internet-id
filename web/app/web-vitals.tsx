'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', metric);
    }
    
    // Send to analytics endpoint
    const body = JSON.stringify(metric);
    const url = '/api/analytics';

    // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, {
        body,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true,
      }).catch(console.error);
    }
  });

  return null;
}
