import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Creator Discovery Page Accessibility', () => {
  test('Axe scan on /creators passes with no WCAG AA violations', async ({ page }) => {
    await page.goto('/creators');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation works end-to-end on creators page', async ({ page }) => {
    await page.goto('/creators');
    await page.waitForLoadState('networkidle');

    // Tab through search, filters, and interactive creator cards
    const focusableCount = 15;
    for (let i = 0; i < focusableCount; i++) {
      await page.keyboard.press('Tab');
      const activeElement = page.locator(':focus');
      await expect(activeElement).toBeVisible();
    }
  });

  test('Screen reader landmark regions and ARIA attributes', async ({ page }) => {
    await page.goto('/creators');
    await page.waitForLoadState('networkidle');

    // Main landmark and heading
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Discover Creators');

    // Filter landmark
    await expect(page.getByRole('complementary', { name: 'Creator filters' })).toBeVisible();

    // Search input accessible name
    const searchInput = page.getByRole('combobox', { name: 'Search creators' });
    await expect(searchInput).toBeVisible();
  });
});
