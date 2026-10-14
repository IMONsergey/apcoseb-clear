import { expect, test } from '@playwright/test';

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
