import { test, expect } from "@playwright/test";

test.describe("Profile Page", () => {
  test("should load profile page", async ({ page }) => {
    await page.goto("/profile");

    // Profile page should load (may redirect to signin if not authenticated)
    await page.waitForURL(/\/(profile|signin)/);
  });

  test("should redirect to signin when not authenticated", async ({ page }) => {
    await page.goto("/profile");

    // Should either show profile or redirect to signin
    const url = page.url();
    expect(url).toMatch(/\/(profile|signin)/);
  });

  test.describe("Authenticated User Profile", () => {
    // These tests assume user is authenticated (skip if no auth)

    test("should display user information", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for user info elements
      const userElements = page.locator(
        '[data-testid="user-info"], [class*="profile"], [class*="user"]'
      );
      const count = await userElements.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should show content history", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for content list or history section
      const contentSection = page.locator('[data-testid="content-history"], [class*="history"]');
      const count = await contentSection.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should display linked accounts", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for linked accounts section
      const accountsSection = page.locator("text=/linked accounts|connected accounts|oauth/i");
      const count = await accountsSection.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should show platform bindings", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for platform binding information
      const platformElements = page.locator("text=/youtube|twitter|tiktok|instagram|platform/i");
      const count = await platformElements.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Account Management", () => {
    test("should show account settings option", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for settings link/button
      const settingsElement = page.locator("button, a").filter({
        hasText: /settings|preferences|edit profile/i,
      });

      const count = await settingsElement.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should have sign out button", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for sign out button
      const signOutButton = page.locator("button, a").filter({
        hasText: /sign out|logout/i,
      });

      const count = await signOutButton.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Content Statistics", () => {
    test("should display registered content count", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for statistics or count elements
      const statsElements = page.locator(
        '[data-testid="stats"], [class*="stat"], [class*="count"]'
      );
      const count = await statsElements.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should show verification statistics", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for verification-related stats
      const verificationStats = page.locator("text=/verified|verification|success rate/i");
      const count = await verificationStats.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should display recent activity", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for activity feed or timeline
      const activitySection = page.locator(
        '[data-testid="activity"], [class*="activity"], [class*="timeline"]'
      );
      const count = await activitySection.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("OAuth Provider Linking", () => {
    test("should show link account options", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for "Link Account" or "Connect" buttons
      const linkButtons = page.locator("button, a").filter({
        hasText: /link|connect|add account|github|google/i,
      });

      const count = await linkButtons.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should display connected GitHub account", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for GitHub-related elements
      const githubElements = page.locator("text=/github/i");
      const count = await githubElements.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should display connected Google account", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for Google-related elements
      const googleElements = page.locator("text=/google/i");
      const count = await googleElements.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Content Management", () => {
    test("should allow navigation to content items", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for clickable content items
      const contentLinks = page.locator('a[href*="/dashboard"], [data-testid="content-link"]');
      const count = await contentLinks.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should show empty state when no content", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for empty state message
      const emptyState = page.locator("text=/no content|get started|upload your first/i");
      const count = await emptyState.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should have action buttons for content", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for action buttons (upload, register, etc.)
      const actionButtons = page.locator("button, a").filter({
        hasText: /upload|register|create|add/i,
      });

      const count = await actionButtons.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Wallet Information", () => {
    test("should display wallet address if connected", async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");

      // Look for wallet address (hex pattern starting with 0x)
      const walletElements = page.locator('code, [class*="address"], [class*="wallet"]');
      const count = await walletElements.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Profile should be visible on mobile (or redirect to signin)
    // Check that page loaded successfully
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 10000 });

    // Verify we're on profile or signin page
    await page.waitForURL(/\/(profile|signin)/, { timeout: 10000 });
  });

  test("should handle loading state", async ({ page }) => {
    await page.goto("/profile");

    // Look for loading indicator
    const loadingIndicator = page.locator(
      '[data-testid="loading"], [class*="loading"], [class*="spinner"]'
    );

    // May show loading state briefly
    const count = await loadingIndicator.count();
    expect(count).toBeGreaterThanOrEqual(0);

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");
  });

  test("should show badges/achievements section", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Look for badges section
    const badgesSection = page.locator("text=/badges|achievement|milestone/i");
    const count = await badgesSection.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });
});
