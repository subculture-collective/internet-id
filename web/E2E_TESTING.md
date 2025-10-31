# End-to-End Testing Guide

This guide covers how to run, debug, and maintain the E2E tests for the Internet-ID web application.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Debugging Tests](#debugging-tests)
- [Writing New Tests](#writing-new-tests)
- [CI Integration](#ci-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The E2E test suite uses [Playwright](https://playwright.dev/), a modern end-to-end testing framework that:

- **Tests across browsers**: Chromium, Firefox, WebKit (Safari)
- **Tests across viewports**: Desktop and mobile devices
- **Provides visual regression testing**: Screenshot comparison
- **Offers powerful debugging**: UI mode, trace viewer, and inspector

### Test Coverage

The test suite covers these core user flows:

1. **Navigation**: Basic page loading and navigation
2. **Authentication**: Sign in/sign up with OAuth providers
3. **Dashboard**: Content viewing and filtering
4. **Content Upload**: File upload, manifest generation, blockchain registration
5. **Platform Binding**: YouTube, Twitter/X, TikTok, Instagram account binding
6. **Profile**: User profile, content history, linked accounts
7. **Accessibility**: WCAG compliance, keyboard navigation, screen readers

## Setup

### Prerequisites

1. **Node.js 20+** and npm installed
2. **Dependencies installed** in both root and web packages
3. **Development environment** configured (see main README)

### Installation

The E2E testing dependencies are already installed if you ran:

```bash
cd web
npm ci --legacy-peer-deps
```

### Browser Installation

Playwright browsers should already be installed, but if needed:

```bash
cd web
npx playwright install
```

To install browsers with system dependencies:

```bash
npx playwright install --with-deps
```

## Running Tests

### Quick Start

Run all E2E tests:

```bash
cd web
npm run test:e2e
```

### Test Modes

#### Headless Mode (Default)

Tests run in background without visible browser:

```bash
npm run test:e2e
```

#### Headed Mode

Watch tests run in real browsers:

```bash
npm run test:e2e:headed
```

#### UI Mode (Interactive)

Best for development - interactive test runner with time-travel debugging:

```bash
npm run test:e2e:ui
```

#### Debug Mode

Run tests with Playwright Inspector for step-by-step debugging:

```bash
npm run test:e2e:debug
```

### Browser-Specific Tests

Run tests on specific browsers:

```bash
# Chromium only
npm run test:e2e:chromium

# Firefox only
npm run test:e2e:firefox

# WebKit (Safari) only
npm run test:e2e:webkit
```

### Mobile Testing

Test on mobile viewports:

```bash
npm run test:e2e:mobile
```

### Specific Test Files

Run a single test file:

```bash
npx playwright test e2e/01-navigation.spec.ts
```

Run tests matching a pattern:

```bash
npx playwright test --grep "authentication"
```

### View Test Reports

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

## Test Structure

### Directory Layout

```
web/
├── e2e/
│   ├── 01-navigation.spec.ts       # Basic navigation and home page
│   ├── 02-authentication.spec.ts   # OAuth sign-in/sign-up flows
│   ├── 03-dashboard.spec.ts        # Dashboard and content viewing
│   ├── 04-content-upload.spec.ts   # Upload and registration flows
│   ├── 05-platform-binding.spec.ts # Platform binding and verification
│   ├── 06-profile.spec.ts          # User profile and account management
│   ├── 07-accessibility.spec.ts    # Accessibility and visual regression
│   ├── fixtures/                   # Test fixtures and data
│   └── utils/
│       └── test-helpers.ts         # Shared utilities and helpers
├── playwright.config.ts            # Playwright configuration
└── E2E_TESTING.md                 # This file
```

### Test Naming Convention

Test files are numbered to indicate recommended execution order:

- `01-*` - Core navigation and page load tests
- `02-*` - Authentication flows
- `03-*` - Main application features
- `04-*` - Advanced workflows
- `05-*` - Platform-specific features
- `06-*` - User account features
- `07-*` - Accessibility and visual tests

## Debugging Tests

### Playwright Inspector

The Playwright Inspector provides step-by-step debugging:

```bash
npm run test:e2e:debug
```

Features:

- Step through each test action
- Pick selectors from the page
- View console logs
- See network requests

### UI Mode

Best debugging experience with time-travel:

```bash
npm run test:e2e:ui
```

Features:

- Watch tests run in real-time
- See test timeline
- Pick locators interactively
- View trace for each test

### Trace Viewer

View traces for failed tests:

```bash
# Run tests with trace
npx playwright test --trace on

# Open trace viewer
npx playwright show-trace trace.zip
```

### Screenshots and Videos

Screenshots are automatically taken on test failure.

Enable video recording:

```bash
npx playwright test --video on
```

Find artifacts in:

- `test-results/` - Screenshots, videos, traces
- `playwright-report/` - HTML test report

### Console Logs

View browser console during tests:

```typescript
test("debug example", async ({ page }) => {
  page.on("console", (msg) => console.log(msg.text()));
  await page.goto("/");
});
```

### Pause Test Execution

Add breakpoints in tests:

```typescript
test("debug example", async ({ page }) => {
  await page.goto("/");
  await page.pause(); // Opens inspector
  // ... rest of test
});
```

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    // Navigate to page
    await page.goto("/");

    // Perform actions
    await page.click("button");

    // Assert expectations
    await expect(page.locator("h1")).toBeVisible();
  });
});
```

### Using Test Helpers

Import utilities from `test-helpers.ts`:

```typescript
import { waitForApiResponse, expectVisible } from "./utils/test-helpers";

test("example", async ({ page }) => {
  await page.goto("/");

  // Wait for API response
  await waitForApiResponse(page, "/api/contents");

  // Check visibility
  await expectVisible(page, ".content-list");
});
```

### Best Practices

1. **Use data-testid for stability**:

   ```typescript
   await page.locator('[data-testid="submit-button"]').click();
   ```

2. **Wait for navigation**:

   ```typescript
   await page.waitForURL("/dashboard");
   ```

3. **Handle async operations**:

   ```typescript
   await page.waitForLoadState("networkidle");
   ```

4. **Use descriptive selectors**:

   ```typescript
   // Good
   await page.getByRole("button", { name: "Submit" }).click();

   // Avoid
   await page.locator("button").nth(2).click();
   ```

5. **Group related tests**:
   ```typescript
   test.describe("Authentication", () => {
     test.describe("Sign In", () => {
       // Sign in tests
     });

     test.describe("Sign Up", () => {
       // Sign up tests
     });
   });
   ```

## CI Integration

### GitHub Actions

The E2E tests can be integrated into CI workflows:

```yaml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: |
          npm ci --legacy-peer-deps
          cd web && npm ci --legacy-peer-deps

      - name: Install Playwright browsers
        working-directory: web
        run: npx playwright install --with-deps

      - name: Start API server
        run: npm run start:api &

      - name: Run E2E tests
        working-directory: web
        run: npm run test:e2e

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: web/playwright-report/
```

### Environment Variables

Configure environment for CI:

```bash
# In CI environment
export CI=true
export BASE_URL=https://preview-deployment.example.com
export NEXT_PUBLIC_API_BASE=https://api.example.com
```

### Parallel Execution

In CI, tests run in parallel by default. Control parallelism:

```bash
# Run with 4 workers
npx playwright test --workers=4

# Run tests serially
npx playwright test --workers=1
```

## Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
test.beforeEach(async ({ page }) => {
  // Setup for each test
  await page.goto("/");
});

test.afterEach(async ({ page }) => {
  // Cleanup after each test
  await page.close();
});
```

### 2. Use Page Objects

For complex pages, use page object pattern:

```typescript
class DashboardPage {
  constructor(private page: Page) {}

  async navigateTo() {
    await this.page.goto("/dashboard");
  }

  async getContentCount() {
    return await this.page.locator('[data-testid="content-item"]').count();
  }
}
```

### 3. Handle Flaky Tests

Make tests more stable:

```typescript
// Use waitFor instead of static timeouts
await page.waitForSelector(".content", { state: "visible" });

// Retry on failure
test.describe.configure({ retries: 2 });

// Wait for network idle
await page.waitForLoadState("networkidle");
```

### 4. Skip Tests Conditionally

Skip tests based on environment:

```typescript
test.skip(process.env.CI === "true", "Requires OAuth credentials");

test.skip(!process.env.ENABLE_UPLOADS, "Upload tests disabled");
```

### 5. Organize Test Data

Use fixtures for test data:

```typescript
import { testData } from "./fixtures/users";

test("example", async ({ page }) => {
  await page.fill('[name="email"]', testData.user1.email);
});
```

## Troubleshooting

### Common Issues

#### Tests Timeout

**Problem**: Tests exceed timeout limit

**Solutions**:

```bash
# Increase timeout
npx playwright test --timeout=60000

# Or in config
use: {
  timeout: 60000,
}
```

#### Browser Not Found

**Problem**: `Executable doesn't exist` error

**Solution**:

```bash
npx playwright install
```

#### Port Already in Use

**Problem**: Dev server can't start on port 3000

**Solution**:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
BASE_URL=http://localhost:3001 npm run test:e2e
```

#### OAuth Tests Fail

**Problem**: OAuth tests fail without credentials

**Solution**: OAuth tests are skipped by default. To enable:

```bash
export GITHUB_TEST_EMAIL=test@example.com
export GITHUB_TEST_PASSWORD=testpass
npm run test:e2e
```

#### Visual Regression Failures

**Problem**: Screenshot comparison fails

**Solution**:

```bash
# Update baseline screenshots
npx playwright test --update-snapshots
```

### Debugging Specific Issues

#### Network Requests

Log all requests:

```typescript
page.on("request", (request) => console.log(">>", request.method(), request.url()));

page.on("response", (response) => console.log("<<", response.status(), response.url()));
```

#### Console Errors

Catch JavaScript errors:

```typescript
page.on("pageerror", (error) => {
  console.error("Page error:", error);
});
```

#### Slow Tests

Identify slow operations:

```bash
# Run with tracing
npx playwright test --trace on

# View trace to see timing
npx playwright show-trace trace.zip
```

### Getting Help

- **Playwright Documentation**: https://playwright.dev/docs/intro
- **GitHub Issues**: https://github.com/subculture-collective/internet-id/issues
- **Playwright Discord**: https://discord.com/invite/playwright-807756831384403968

## Visual Regression Testing

### Creating Baseline Screenshots

First run creates baseline screenshots:

```bash
npm run test:e2e -- e2e/07-accessibility.spec.ts
```

### Updating Baselines

When UI changes are intentional:

```bash
npx playwright test --update-snapshots
```

### Reviewing Differences

Failed visual tests generate diff images in `test-results/`:

- `*-actual.png` - Current screenshot
- `*-expected.png` - Baseline screenshot
- `*-diff.png` - Difference visualization

## Performance Testing

Monitor test execution time:

```bash
# Show test duration
npx playwright test --reporter=list
```

Slow test threshold in config:

```typescript
use: {
  timeout: 30000,
}
```

## Continuous Improvement

### Test Maintenance

1. **Review flaky tests weekly**
2. **Update selectors when UI changes**
3. **Add tests for new features**
4. **Remove obsolete tests**

### Metrics to Track

- Test execution time
- Flakiness rate (failed then passed on retry)
- Coverage of user flows
- Browser compatibility issues

### Code Review Checklist

- [ ] Tests are independent and can run in any order
- [ ] No hardcoded waits (use waitFor methods)
- [ ] Descriptive test names
- [ ] Proper use of data-testid attributes
- [ ] Error handling for edge cases
- [ ] Mobile viewport coverage
- [ ] Accessibility checks included

## Additional Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Tests Guide](https://playwright.dev/docs/writing-tests)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [Test Runners](https://playwright.dev/docs/test-runners)
- [CI/CD Integration](https://playwright.dev/docs/ci)

---

For questions or issues with E2E testing, please open an issue on GitHub or consult the Playwright documentation.
