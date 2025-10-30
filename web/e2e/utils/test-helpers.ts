import { Page, expect } from '@playwright/test';

/**
 * Utility functions for E2E tests
 */

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page, url: string | RegExp) {
  await page.waitForURL(url);
}

/**
 * Fill form field by label text
 */
export async function fillFormField(
  page: Page,
  label: string,
  value: string
) {
  const input = page.getByLabel(label);
  await input.fill(value);
}

/**
 * Click button by text
 */
export async function clickButton(page: Page, text: string | RegExp) {
  const button = page.getByRole('button', { name: text });
  await button.click();
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options?: { timeout?: number }
) {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout: options?.timeout || 30000 }
  );
}

/**
 * Check if element is visible
 */
export async function expectVisible(page: Page, selector: string) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
}

/**
 * Check if text is present on page
 */
export async function expectTextPresent(page: Page, text: string | RegExp) {
  await expect(page.getByText(text)).toBeVisible();
}

/**
 * Generate random test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@example.com`,
    name: `Test User ${timestamp}`,
    filename: `test-file-${timestamp}.txt`,
    platformId: `platform-${timestamp}`,
  };
}

/**
 * Create a test file blob
 */
export async function createTestFile(
  filename: string,
  content: string = 'Test content for E2E testing'
): Promise<{ filename: string; content: string; buffer: Buffer }> {
  const buffer = Buffer.from(content, 'utf-8');
  return {
    filename,
    content,
    buffer,
  };
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return !!process.env.CI;
}

/**
 * Get API base URL
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
}

/**
 * Skip test if condition is met
 */
export function skipIf(condition: boolean, reason: string) {
  if (condition) {
    return { skip: true, reason };
  }
  return { skip: false };
}
