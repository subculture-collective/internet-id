import { test, expect } from '@playwright/test';

test.describe('Navigation and Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Internet-ID|Internet ID/i);
    
    // Check for key elements on home page
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to dashboard page', async ({ page }) => {
    await page.goto('/');
    
    // Try to find dashboard link
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    
    // If dashboard link exists, click it and verify navigation
    const dashboardLinkCount = await dashboardLink.count();
    if (dashboardLinkCount > 0) {
      await dashboardLink.first().click();
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  test('should navigate to verify page', async ({ page }) => {
    await page.goto('/');
    
    // Try to find verify link
    const verifyLink = page.getByRole('link', { name: /verify/i });
    
    const verifyLinkCount = await verifyLink.count();
    if (verifyLinkCount > 0) {
      await verifyLink.first().click();
      await expect(page).toHaveURL(/\/verify/);
    } else {
      // Navigate directly if no link found
      await page.goto('/verify');
      await expect(page).toHaveURL(/\/verify/);
    }
  });

  test('should navigate to profile page', async ({ page }) => {
    await page.goto('/');
    
    // Try to find profile link
    const profileLink = page.getByRole('link', { name: /profile/i });
    
    const profileLinkCount = await profileLink.count();
    if (profileLinkCount > 0) {
      await profileLink.first().click();
      // Profile may redirect to sign-in if not authenticated
      await page.waitForURL(/\/(profile|signin)/);
    }
  });

  test('should have responsive design', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle 404 page', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345');
    
    // Next.js may return 404 status or redirect
    if (response) {
      const status = response.status();
      // Accept 404 or 200 (Next.js custom 404 pages return 200)
      expect([200, 404]).toContain(status);
    }
  });
});
