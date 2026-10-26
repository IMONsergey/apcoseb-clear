import { expect, test, type Page } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';

async function checkArtwork(page: Page, theme: 'light' | 'dark') {
  const images = page.locator('[data-artwork-theme]');
  await expect(images.first()).toBeAttached();
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute('data-artwork-theme', theme);
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
    const result = await image.evaluate((el: HTMLImageElement) => ({
      src: el.currentSrc,
      filter: getComputedStyle(el).filter,
    }));
    expect(result.src.includes('-dark')).toBe(theme === 'dark');
    expect(result.filter).toBe('none');
  }
}

for (const route of siteRoutes.filter(
  (route) => route.group !== 'legal' && route.group !== 'documentation',
)) {
  test(`dark artwork loads without light-image downloads on ${route.path}`, async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => {
      if (/\/assets\/(inner|editorial|use-cases)\/.*\.webp/.test(request.url()))
        requested.push(request.url());
    });
    await page.addInitScript(() => localStorage.setItem('apcosys-theme-mode', 'dark'));
    await page.goto('.' + route.path);
    await checkArtwork(page, 'dark');
    expect(requested.length).toBeGreaterThan(0);
    expect(requested.filter((url) => !url.includes('-dark'))).toEqual([]);
  });
}

test('manual theme selection changes the artwork without changing hero geometry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('apcosys-theme-mode', 'light'));
  await page.goto('./about');
  await checkArtwork(page, 'light');
  await page.evaluate(() => scrollTo(0, 0));
  const before = await page.locator('.page-artwork').boundingBox();
  for (const theme of ['Dark', 'Light'] as const) {
    await page.evaluate(() => scrollTo(0, 0));
    await page.getByRole('button', { name: 'Appearance', exact: true }).click();
    await page.getByRole('menuitemradio', { name: theme, exact: true }).click();
    await checkArtwork(page, theme === 'Dark' ? 'dark' : 'light');
    await page.evaluate(() => scrollTo(0, 0));
    const after = await page.locator('.page-artwork').boundingBox();
    expect(after?.width).toBe(before?.width);
    expect(after?.height).toBe(before?.height);
  }
});

test('system theme changes select dark responsive artwork on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => localStorage.setItem('apcosys-theme-mode', 'system'));
  await page.goto('./about');
  await checkArtwork(page, 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await checkArtwork(page, 'dark');
  const source = await page
    .locator('[data-artwork-theme][srcset]')
    .evaluate((el: HTMLImageElement) => el.currentSrc);
  expect(source).toMatch(/-dark-600\.webp$/);
});
