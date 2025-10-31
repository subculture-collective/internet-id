# SEO Analytics & Tracking Setup Guide

This guide covers setting up analytics and search engine tracking for Internet-ID.

## Google Analytics 4 (GA4) Setup

### 1. Create a GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click "Admin" (gear icon in bottom left)
3. Click "Create Property"
4. Enter property details:
   - Property name: "Internet-ID"
   - Reporting time zone: Your timezone
   - Currency: USD (or your preference)
5. Click "Next" and complete the business details
6. Choose your business objectives
7. Click "Create" and accept the Terms of Service

### 2. Set Up Data Stream

1. In Property settings, click "Data Streams"
2. Click "Add stream" → "Web"
3. Enter your website URL: `https://internet-id.io`
4. Enter stream name: "Internet-ID Web"
5. Click "Create stream"
6. Copy your **Measurement ID** (format: G-XXXXXXXXXX)

### 3. Add GA4 to Your Application

Add the Measurement ID to your `.env.local` file:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Create a Google Analytics component at `web/app/components/GoogleAnalytics.tsx`:

```typescript
'use client';

import Script from 'next/script';

export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!measurementId) {
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
```

Add it to your root layout (`web/app/layout.tsx`):

```typescript
import GoogleAnalytics from './components/GoogleAnalytics';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
```

### 4. Track Custom Events

Add custom event tracking for key actions:

```typescript
// Track verification completion
gtag("event", "verification_complete", {
  content_hash: contentHash,
  platform: platform,
});

// Track content registration
gtag("event", "content_registered", {
  registry_address: registryAddress,
  transaction_hash: txHash,
});

// Track badge downloads
gtag("event", "badge_download", {
  content_hash: contentHash,
  badge_theme: theme,
});
```

## Google Search Console Setup

### 1. Add Your Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add property"
3. Choose "URL prefix" method
4. Enter: `https://internet-id.io`
5. Click "Continue"

### 2. Verify Ownership

Choose one of these verification methods:

#### Method A: HTML File Upload

1. Download the verification HTML file
2. Upload it to `web/public/` directory
3. Deploy your site
4. Click "Verify" in Search Console

#### Method B: DNS Verification (Recommended)

1. Copy the TXT record provided
2. Add it to your DNS settings
3. Wait for DNS propagation (up to 24 hours)
4. Click "Verify" in Search Console

#### Method C: HTML Meta Tag

Add the verification meta tag to your `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_verification_code
```

The meta tag is already configured in `web/app/layout.tsx`:

```typescript
verification: {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
}
```

### 3. Submit Your Sitemap

1. In Search Console, go to "Sitemaps" (left sidebar)
2. Enter your sitemap URL: `https://internet-id.io/sitemap.xml`
3. Click "Submit"
4. Monitor indexing status over the next few days

### 4. Configure Settings

1. **URL Parameters**: Configure any URL parameters that shouldn't affect content
2. **Crawl Rate**: Let Google decide (default)
3. **Geotargeting**: Set to United States (or your target country)

## Bing Webmaster Tools Setup

### 1. Add Your Site

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Click "Add a site"
3. Enter: `https://internet-id.io`
4. Click "Add"

### 2. Verify Ownership

Choose one of these methods:

#### Method A: XML File Upload

1. Download the BingSiteAuth.xml file
2. Upload to `web/public/`
3. Deploy and verify

#### Method B: DNS Verification

1. Add the provided CNAME record to your DNS
2. Click "Verify"

#### Method C: Import from Google Search Console (Easiest)

1. Click "Import from Google Search Console"
2. Authorize the connection
3. Your site will be automatically verified

### 3. Submit Your Sitemap

1. Go to "Sitemaps" in Bing Webmaster Tools
2. Enter: `https://internet-id.io/sitemap.xml`
3. Click "Submit"

## Monitoring & Optimization

### Key Metrics to Track

1. **Search Console Metrics**:
   - Total impressions
   - Average position
   - Click-through rate (CTR)
   - Total clicks

2. **GA4 Metrics**:
   - Organic search traffic
   - Bounce rate
   - Average session duration
   - Pages per session
   - Conversion rate (verification completions)

3. **Page Performance**:
   - Core Web Vitals (LCP, FID, CLS)
   - Page load time
   - Time to Interactive (TTI)

### Regular SEO Tasks

1. **Weekly**:
   - Check Search Console for indexing errors
   - Monitor top search queries
   - Review CTR for top pages

2. **Monthly**:
   - Analyze organic traffic trends
   - Review and update meta descriptions for low-CTR pages
   - Check for broken links
   - Review competitor rankings

3. **Quarterly**:
   - Conduct keyword research for new content
   - Update structured data
   - Audit and improve page speed
   - Review and update content strategy

## Troubleshooting

### Sitemap Not Indexing

1. Check `robots.txt` allows crawling of sitemap
2. Verify sitemap is accessible: `https://internet-id.io/sitemap.xml`
3. Check for XML formatting errors
4. Resubmit sitemap in Search Console

### Pages Not Appearing in Search

1. Check robots.txt isn't blocking pages
2. Verify meta robots tags don't have `noindex`
3. Check for canonical URL issues
4. Ensure pages have unique title and description
5. Wait 2-4 weeks for initial indexing

### Low Click-Through Rate

1. Improve meta titles (add keywords, make compelling)
2. Enhance meta descriptions (add call-to-action)
3. Use schema markup for rich snippets
4. Optimize page content for featured snippets

## Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Google Search Console Help](https://support.google.com/webmasters)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmasters-guidelines-30fba23a)
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)
