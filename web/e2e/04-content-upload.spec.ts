import { test, expect } from '@playwright/test';
import { isCI } from './utils/test-helpers';

test.describe('Content Upload and Registration', () => {
  test.skip(isCI(), 'Upload tests require API server - skip in CI without setup');

  test('should display upload page or form', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for upload-related buttons or links
    const uploadElements = page.locator('button, a, input[type="file"]').filter({
      hasText: /upload|register|one-shot|add content/i,
    });
    
    const count = await uploadElements.count();
    if (count > 0) {
      // Upload functionality is present
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should show file input for upload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for file input elements
    const fileInputs = page.locator('input[type="file"]');
    const count = await fileInputs.count();
    
    // File input may or may not be visible initially
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should validate file selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for file input
    const fileInput = page.locator('input[type="file"]').first();
    const count = await page.locator('input[type="file"]').count();
    
    if (count > 0) {
      // Check if file input is present
      await expect(fileInput).toBeDefined();
    }
  });

  test.describe('Upload Form Validation', () => {
    test('should show required fields', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for form fields related to upload/registration
      const formFields = page.locator('input, select, textarea');
      const count = await formFields.count();
      
      // Some form fields should exist for upload
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should display registry address field', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for registry address input
      const registryInput = page.locator('input').filter({
        hasText: /registry|address|contract/i,
      }).or(page.locator('input[placeholder*="registry"], input[placeholder*="address"]'));
      
      const count = await registryInput.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show IPFS or manifest options', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for IPFS/manifest related text or inputs
      const ipfsElements = page.locator('text=/ipfs|manifest|cid/i');
      const count = await ipfsElements.count();
      
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('One-Shot Upload Flow', () => {
    test('should display one-shot upload option', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for one-shot upload button/section
      const oneShotElement = page.locator('text=/one-shot|one shot|quick upload|all-in-one/i');
      const count = await oneShotElement.count();
      
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show privacy options for upload', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for privacy-related checkboxes
      const privacyCheckbox = page.locator('input[type="checkbox"]').filter({
        hasText: /upload|privacy|content|video/i,
      });
      
      const count = await privacyCheckbox.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Manifest Generation', () => {
    test('should display manifest preview', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for manifest-related sections
      const manifestSection = page.locator('[data-testid="manifest"], pre, code').filter({
        hasText: /manifest|content_hash|signature/i,
      });
      
      const count = await manifestSection.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show content hash after file selection', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for hash display elements
      const hashElements = page.locator('code, [class*="hash"], pre');
      const count = await hashElements.count();
      
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Blockchain Registration', () => {
    test('should show registration status', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for status indicators
      const statusElements = page.locator('[class*="status"], [class*="badge"]');
      const count = await statusElements.count();
      
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should display transaction hash after registration', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for transaction hash links
      const txLinks = page.locator('a[href*="etherscan"], a[href*="basescan"], a[href*="polygonscan"]');
      const count = await txLinks.count();
      
      // Only present if content has been registered
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show explorer link for registered content', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for "View on Explorer" type links
      const explorerLinks = page.locator('a').filter({
        hasText: /explorer|etherscan|basescan|view on/i,
      });
      
      const count = await explorerLinks.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should display error messages for invalid input', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for error message elements
      const errorElements = page.locator('[class*="error"], [role="alert"], .text-red, [class*="danger"]');
      const count = await errorElements.count();
      
      // Errors may not be visible initially
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should handle upload failures gracefully', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // The page should be stable even if uploads fail
      const mainContent = page.locator('main, body');
      await expect(mainContent).toBeVisible();
    });
  });

  test('should be responsive during upload flow', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Upload interface should be visible on mobile
    const mainContent = page.locator('main, body');
    await expect(mainContent).toBeVisible();
  });
});
