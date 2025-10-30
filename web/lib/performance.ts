/**
 * Performance utilities for web vitals and optimization
 */

/**
 * Report Web Vitals to analytics
 * This can be customized to send to your preferred analytics service
 */
export function reportWebVitals(metric: any) {
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Performance]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }
  
  // Send to analytics in production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const body = JSON.stringify(metric);
    const url = '/api/analytics';

    // Use sendBeacon if available (more reliable)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      // Fallback to fetch with keepalive
      fetch(url, {
        body,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(console.error);
    }
  }
}

/**
 * Create a dynamic import for lazy loading
 * Usage: const LazyComponent = dynamic(() => import('./Component'))
 */
export function createDynamicImport<T = any>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    loading?: () => any;
    ssr?: boolean;
  }
) {
  // This is a helper that returns the import function
  // Actual usage should be with next/dynamic
  return { importFunc, options };
}

/**
 * Defer non-critical scripts until after page load
 * Usage: deferScript(() => { your code here })
 */
export function deferScript(callback: () => void) {
  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') {
      callback();
    } else {
      window.addEventListener('load', callback);
    }
  }
}

/**
 * Prefetch a route for faster navigation
 * Usage: prefetchRoute('/dashboard')
 */
export function prefetchRoute(href: string) {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Optimize images by lazy loading them
 */
export function observeImages() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img);
  });
}
