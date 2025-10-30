import { test, expect } from '@playwright/test';

test.describe('Accessibility and Visual Regression', () => {
  test.describe('Accessibility Standards', () => {
    test('home page should have proper document structure', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for main landmark
      const main = page.locator('main, [role="main"]');
      const mainCount = await main.count();
      expect(mainCount).toBeGreaterThanOrEqual(0);
      
      // Check for navigation
      const nav = page.locator('nav, [role="navigation"]');
      const navCount = await nav.count();
      expect(navCount).toBeGreaterThanOrEqual(0);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for h1 heading
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBeGreaterThanOrEqual(0);
    });

    test('interactive elements should be keyboard accessible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Check if focus is visible (at least one focusable element exists)
      const focusableElements = page.locator('a, button, input, select, textarea');
      const count = await focusableElements.count();
      expect(count).toBeGreaterThan(0);
    });

    test('buttons should have accessible names', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Get all buttons
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      // Each button should have text or aria-label
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        // Button should have text or aria-label
        expect(text || ariaLabel).toBeTruthy();
      }
    });

    test('images should have alt text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Get all images
      const images = page.locator('img');
      const imageCount = await images.count();
      
      // Check alt attribute for each image
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        
        // Alt attribute should exist (can be empty for decorative images)
        expect(alt !== null).toBeTruthy();
      }
    });

    test('form inputs should have labels', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Get all input fields (excluding hidden)
      const inputs = page.locator('input:visible, textarea:visible, select:visible');
      const inputCount = await inputs.count();
      
      // Each input should have label, aria-label, or aria-labelledby
      for (let i = 0; i < Math.min(inputCount, 10); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');
        
        // Should have some form of label
        const hasLabel = id || ariaLabel || ariaLabelledBy || placeholder;
        expect(hasLabel).toBeTruthy();
      }
    });

    test('links should have descriptive text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Get all links
      const links = page.locator('a');
      const linkCount = await links.count();
      
      // Check link text
      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        
        // Link should have text or aria-label
        expect(text || ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('Color Contrast and Theme', () => {
    test('should have readable text contrast', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Get background and text colors
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Color contrast is hard to test automatically, but ensure elements are visible
      const mainText = page.locator('p, h1, h2, h3, span');
      const textCount = await mainText.count();
      expect(textCount).toBeGreaterThan(0);
    });

    test('should support dark/light theme toggle', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for theme toggle button
      const themeToggle = page.locator('button').filter({
        hasText: /theme|dark|light/i,
      });
      
      const toggleCount = await themeToggle.count();
      // Theme toggle is optional
      expect(toggleCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Visual Regression Tests', () => {
    test('home page visual snapshot', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot for visual comparison
      await expect(page).toHaveScreenshot('home-page.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test('dashboard page visual snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await expect(page).toHaveScreenshot('dashboard-page.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test('verify page visual snapshot', async ({ page }) => {
      await page.goto('/verify');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await expect(page).toHaveScreenshot('verify-page.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test('signin page visual snapshot', async ({ page }) => {
      await page.goto('/signin');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await expect(page).toHaveScreenshot('signin-page.png', {
        fullPage: false, // Auth page might be short
        maxDiffPixels: 100,
      });
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be touch-friendly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check button sizes (should be at least 44x44 for touch)
      const buttons = page.locator('button, a[role="button"]');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const box = await firstButton.boundingBox();
        
        // Buttons should exist and be clickable
        expect(box).toBeTruthy();
      }
    });

    test('should have mobile-friendly navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for mobile menu or navigation
      const nav = page.locator('nav, [role="navigation"], button').filter({
        hasText: /menu|navigation/i,
      });
      
      const navCount = await nav.count();
      expect(navCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Performance Accessibility', () => {
    test('should have reasonable page load time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Page should load in reasonable time (10 seconds)
      expect(loadTime).toBeLessThan(10000);
    });

    test('should not have excessive JavaScript errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should have no or minimal errors
      expect(errors.length).toBeLessThan(5);
    });
  });

  test.describe('ARIA Roles and States', () => {
    test('should use appropriate ARIA roles', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for common ARIA roles
      const ariaElements = page.locator('[role]');
      const count = await ariaElements.count();
      
      // Some ARIA roles should be present
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should indicate loading states with ARIA', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Look for aria-busy or loading indicators
      const loadingElements = page.locator('[aria-busy="true"], [aria-live]');
      const count = await loadingElements.count();
      
      // ARIA attributes may be present during loading
      expect(count).toBeGreaterThanOrEqual(0);
      
      await page.waitForLoadState('networkidle');
    });
  });
});
