import { expect, test } from '@playwright/test';

test.describe('bg-remove smoke', () => {
  test('loads the shell and renders lucide icons as svg', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('BG Remove')).toBeVisible();
    await expect(page.getByText('Remove backgrounds instantly, 100% client-side')).toBeVisible();

    // lucide's createIcons must replace the <i data-lucide> placeholders in a real browser.
    await expect(page.locator('svg').first()).toBeVisible();
    await expect(page.locator('i[data-lucide]')).toHaveCount(0);

    await expect(page.locator('#upload-zone')).toBeVisible();
    await expect(page.locator('#image-preview-container')).toBeHidden();
    await expect(page.locator('#download-btn')).toBeDisabled();
  });

  test('toggles theme and persists across reload', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');

    // Defaults to dark.
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // The checkbox is visually hidden; a real user clicks the toggle label.
    await page.locator('.theme-toggle-btn').click();
    await expect(html).toHaveAttribute('data-theme', 'light');

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });
});
