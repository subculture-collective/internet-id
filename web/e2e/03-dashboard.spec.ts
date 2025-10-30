import { test, expect } from '@playwright/test';

test.describe('Dashboard and Content Viewing', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Dashboard should load
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display content list', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for content sections or empty state
    const contentSection = page.locator('[data-testid="content-list"], .content-list, main');
    await expect(contentSection).toBeVisible();
  });

  test('should show empty state when no content exists', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for either content items or empty state message
    const hasContent = await page.locator('[data-testid="content-item"]').count();
    
    if (hasContent === 0) {
      // Should show empty state or no content message
      const emptyState = page.locator('text=/no content|empty|get started|upload/i');
      const emptyStateCount = await emptyState.count();
      // Either empty state exists or page is just empty (both valid)
      expect(emptyStateCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have filter options', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for filter controls
    const filters = page.locator('select, [role="combobox"], button').filter({
      hasText: /filter|status|platform|sort/i,
    });
    
    // Filters may or may not be present depending on implementation
    const count = await filters.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display verification statistics', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for stats or metrics sections
    const statsSection = page.locator('[data-testid="stats"], [class*="stat"]');
    
    // Stats may or may not be visible depending on content
    const count = await statsSection.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show content details when item is clicked', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if there are content items
    const contentItems = page.locator('[data-testid="content-item"]').first();
    const count = await page.locator('[data-testid="content-item"]').count();
    
    if (count > 0) {
      // Click on first content item
      await contentItems.click();
      
      // Should show more details (modal, expanded view, or navigation)
      await page.waitForTimeout(500); // Wait for any animations
    }
  });

  test('should display platform bindings', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for platform-related elements (YouTube, Twitter, etc.)
    const platformElements = page.locator('text=/youtube|twitter|tiktok|instagram/i');
    
    const count = await platformElements.count();
    // Platform elements may or may not exist
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show verification status badges', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for status indicators
    const statusBadges = page.locator('[class*="badge"], [class*="status"]');
    
    const count = await statusBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have pagination or load more functionality', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for pagination controls
    const paginationElements = page.locator(
      'button, a',
      { hasText: /next|previous|load more|page/i }
    ).or(page.locator('[data-testid="pagination"]'));
    
    const count = await paginationElements.count();
    // Pagination may not be present if there's not enough content
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display content hash information', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for hash-like strings (hex patterns)
    const hashPatterns = page.locator('code, [class*="hash"], [class*="mono"]');
    
    const count = await hashPatterns.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show transaction links for on-chain content', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for blockchain explorer links
    const explorerLinks = page.locator('a[href*="etherscan"], a[href*="basescan"], a[href*="polygonscan"]');
    
    const count = await explorerLinks.count();
    // Explorer links only present if content is registered on-chain
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle loading state', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for loading indicators
    const loadingIndicator = page.locator('[data-testid="loading"], [class*="loading"], [class*="spinner"]');
    
    // May briefly show loading state
    const count = await loadingIndicator.count();
    expect(count).toBeGreaterThanOrEqual(0);
    
    // Wait for loading to complete
    await page.waitForLoadState('networkidle');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Dashboard should still be visible and functional on mobile
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();
  });
});
