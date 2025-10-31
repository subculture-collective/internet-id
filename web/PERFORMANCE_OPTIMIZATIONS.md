# Performance Optimizations

## Implemented Optimizations

### 1. Next.js Configuration Enhancements

- **File**: `web/next.config.mjs`
- **Changes**:
  - Enabled `compress: true` for gzip compression
  - Removed `poweredByHeader` to reduce response size
  - Configured image optimization with AVIF and WebP formats
  - Added device sizes and image sizes for responsive images
  - Enabled `swcMinify` for faster minification
  - Disabled production source maps to reduce bundle size
  - Added package imports optimization for frequently used packages
  - Configured cache headers for static assets (1 year for immutable assets)
  - Added bundle analyzer support (`ANALYZE=true npm run build`)

### 2. Web Vitals Monitoring

- **Files**: `web/app/web-vitals.tsx`, `web/app/api/analytics/route.ts`
- **Changes**:
  - Implemented Web Vitals tracking using Next.js built-in hooks
  - Created analytics endpoint to collect performance metrics
  - Monitors: LCP, FID, CLS, FCP, TTFB, INP
  - Uses `navigator.sendBeacon()` for reliable reporting
  - Logs metrics in development, sends to analytics in production

### 3. Font Optimization

- **File**: `web/app/globals.css`
- **Changes**:
  - Added `font-display: swap` to prevent FOIT (Flash of Invisible Text)
  - Enabled `text-rendering: optimizeLegibility`
  - Added `-webkit-font-smoothing: antialiased` for better rendering
  - Uses system fonts (already optimal, no external font loading)

### 3a. Security and Performance Headers

- **File**: `web/next.config.mjs`
- **Headers Added**:
  - `X-DNS-Prefetch-Control: on` - Enables DNS prefetching
  - `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
  - `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
  - `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

### 4. Resource Hints

- **File**: `web/app/layout.tsx`
- **Changes**:
  - Added `preconnect` to IPFS gateway for faster third-party connections
  - Added `dns-prefetch` as fallback for older browsers

### 5. Performance Budgets

- **File**: `web/performance-budget.json`
- **Budget Limits**:
  - JavaScript: 400 KB
  - Total resources: 1000 KB
  - Document: 50 KB
  - Stylesheet: 50 KB
  - Images: 200 KB
  - Font: 100 KB
- **Timing Budgets**:
  - Interactive: 5000ms
  - First Contentful Paint: 2000ms
  - Largest Contentful Paint: 2500ms
  - Cumulative Layout Shift: 0.1

### 6. Lighthouse CI Integration

- **File**: `web/lighthouserc.json`
- **Configuration**:
  - Runs 3 audits per session for consistency
  - Desktop preset with realistic throttling
  - Minimum scores: Performance 80%, Accessibility 90%, Best Practices 90%, SEO 90%
  - Automated assertions for Core Web Vitals

### 7. CI/CD Performance Checks

- **File**: `.github/workflows/performance.yml`
- **Features**:
  - Runs on every PR affecting web code
  - Builds with bundle analyzer enabled
  - Reports bundle sizes in PR comments
  - Uploads bundle analysis artifacts
  - Prevents performance regressions

### 8. Performance Utilities

- **File**: `web/lib/performance.ts`
- **Utilities**:
  - `reportWebVitals()` - Send metrics to analytics
  - `deferScript()` - Defer non-critical scripts
  - `prefetchRoute()` - Prefetch routes for faster navigation
  - `supportsWebP()` - Detect WebP support
  - `observeImages()` - Lazy load images with Intersection Observer

### 9. Performance Report Script

- **File**: `web/scripts/performance-report.js`
- **Features**:
  - Analyzes build output size
  - Compares against performance budgets
  - Generates JSON report
  - Fails CI if budgets are exceeded
  - Run with: `npm run perf:report`

## Recommended Next Steps

### Code Splitting (Future Enhancement)

The main page.tsx (1683 lines) contains multiple form components that could benefit from lazy loading:

- Upload Form
- One-shot Form
- Manifest Form
- Register Form
- Verify Form
- Proof Form
- Bind Form
- Browse Contents
- Verifications View

**Recommendation**: Extract each form into separate components under `web/app/forms/` and use `next/dynamic` with `ssr: false` for client-side only forms. This would reduce initial bundle size significantly.

### Image Optimization (Future Enhancement)

- Replace `<img>` tags with Next.js `<Image>` component
- Add proper width/height attributes to prevent CLS
- Generate placeholder images for better perceived performance
- Consider using `blur` placeholder option

### Third-Party Script Optimization

Currently, no third-party scripts are detected. If added in the future:

- Use `next/script` with appropriate loading strategy (`defer` or `async`)
- Load analytics scripts after user interaction
- Consider using Partytown for heavy third-party scripts

## Core Web Vitals Targets

### Current Status

- ✅ Configuration in place to achieve targets
- ✅ Monitoring enabled
- ✅ CI checks configured

### Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
  - Current optimizations: Image optimization, font optimization, compression
- **FID (First Input Delay)**: < 100ms
  - Current optimizations: Code splitting ready, minimal JavaScript on initial load
- **CLS (Cumulative Layout Shift)**: < 0.1
  - Current optimizations: Responsive CSS with proper sizing, system fonts

## Monitoring & Analytics

### Development

- Web Vitals metrics logged to console
- Bundle analyzer available via `npm run build:analyze`

### Production (To Implement)

- Configure analytics service integration in `/api/analytics/route.ts`
- Options: Google Analytics 4, Vercel Analytics, or custom solution
- Set up Real User Monitoring (RUM) dashboard

## Performance Testing

### Local Testing

```bash
# Build with bundle analysis
npm run build:analyze

# Run Lighthouse CI
npm run perf:audit
```

### CI Testing

- Automated on every PR
- Performance budgets enforced
- Bundle size regression detection

## CDN & Caching Strategy

### Static Assets

- Cache-Control headers configured for 1 year (immutable)
- Manifest cached for 24 hours with revalidation

### Recommended CDN Configuration

- Serve static assets from edge locations
- Enable Brotli compression (better than gzip)
- Use HTTP/2 or HTTP/3
- Configure proper cache purging on deployments

## Verification Commands

```bash
# Build and analyze bundle
cd web && npm run build:analyze

# Run performance audit
cd web && npm run perf:audit

# Check build size
du -sh web/.next
```
