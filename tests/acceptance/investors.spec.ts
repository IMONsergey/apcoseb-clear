import { expect, test } from '@playwright/test';

for (const edition of [
  { prefix: '', title: 'For investors.' },
  { prefix: 'ru/', title: 'Инвесторам.' },
  { prefix: 'zh-hant/', title: '投資人專區。' },
]) {
  for (const theme of ['light', 'dark']) {
    test(`investor enquiries remain reachable in ${edition.prefix || 'en'} ${theme}`, async ({
      page,
      baseURL,
    }) => {
      await page.addInitScript((mode) => localStorage.setItem('apcosys-theme-mode', mode), theme);
      for (const width of [320, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`./${edition.prefix}docs/investors`);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(edition.title);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const image = page.locator('.page-artwork img');
        await expect(image).toHaveAttribute(
          'src',
          new RegExp(`investors${theme === 'dark' ? '-dark' : ''}\\.webp$`),
        );
        await expect
          .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
          .toBe(960);
        await expect(page.locator('main a[href="mailto:rk@apcosys.net"]')).toHaveCount(2);
        const href = new URL(`./${edition.prefix}docs/investors`, baseURL!).pathname;
        await expect(page.locator(`footer a[href="${href}"]`)).toHaveCount(1);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        ).toBeLessThanOrEqual(1);
      }
    });
  }
}
