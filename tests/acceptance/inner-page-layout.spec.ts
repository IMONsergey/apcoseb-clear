import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';

for (const width of [320, 768, 1440]) {
  test(`internal pages keep their hierarchy and illustration at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    for (const route of siteRoutes.filter(
      (route) => route.path !== '/' && !route.path.startsWith('/legal/'),
    )) {
      await page.goto('.' + route.path);
      const hero = page.locator('.stage-page-hero');
      await expect(hero.locator('h1')).toBeVisible();
      const illustration = hero.locator('img');
      await expect(illustration).toHaveCount(1);
      await expect(illustration).toHaveAttribute('alt', /\S/);
      await expect
        .poll(() => illustration.evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0);
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        title: parseFloat(getComputedStyle(document.querySelector('h1')!).fontSize),
        headings: [...document.querySelectorAll('.inner-pages h2')].map((heading) =>
          parseFloat(getComputedStyle(heading).fontSize),
        ),
      }));
      expect(layout.overflow, route.path).toBeLessThanOrEqual(1);
      expect(
        layout.headings.every((size) => size < layout.title),
        route.path,
      ).toBe(true);
    }
  });
}

test('all monitoring stages fit on desktop without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./platform/monitoring');
  const stages = page.locator('.stage-monitor-console__sidebar');
  await expect(stages.locator('button')).toHaveCount(5);
  expect(await stages.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await stages.scrollIntoViewIfNeeded();
  await expect(stages.locator('button').last()).toBeInViewport();
});

test('API access and rate columns fit together on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('./developers/api');
  const table = page.locator('.stage-api-limits .stage-table-scroll');
  expect(await table.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
});
