import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`Initial theme applies before the application downloads: ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme === 'light' ? 'dark' : 'light' });
    await page.addInitScript((mode) => localStorage.setItem('apcosys-theme-mode', mode), theme);
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/\/assets\/index-[\w-]+\.js$/, async (route) => {
      await held;
      await route.continue();
    });
    try {
      await page.goto('./', { waitUntil: 'commit' });
      await expect(page.locator('html')).toHaveAttribute('data-theme-mode', theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('main h1')).toHaveCount(0);
      release();
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    } finally {
      release();
    }
  });
}

test('rapid theme changes retain the newest transition interval', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  await expect(page.locator('main h1')).toBeVisible();

  const state = await page.evaluate(async () => {
    const setMode = (mode: 'light' | 'dark') =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'apcosys-theme-mode',
          newValue: mode,
        }),
      );
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    setMode('dark');
    await pause(150);
    setMode('light');
    await pause(150);

    return {
      theme: document.documentElement.dataset.theme,
      transitionActive: document.documentElement.hasAttribute('data-theme-transition'),
    };
  });

  expect(state).toEqual({ theme: 'light', transitionActive: true });
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition', '');
});
