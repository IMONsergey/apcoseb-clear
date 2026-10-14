import { expect, test } from '@playwright/test';

test('technical evidence keeps its desktop reading order when placed in a narrow panel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const evidence = page.locator('.search-scene__results .product-evidence');
  await expect(evidence).toBeVisible();
  await evidence.evaluate((element: HTMLElement) => {
    element.style.width = '420px';
  });
  await expect
    .poll(() =>
      page
        .locator('.product-evidence__layout')
        .first()
        .evaluate((element) => {
          return getComputedStyle(element).gridTemplateColumns.split(' ').length;
        }),
    )
    .toBe(1);
  await expect(
    page.locator('.search-scene__results .product-evidence__result-meta').first(),
  ).toBeVisible();
});

test('data lens adapts its internal columns to its own width', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  await page.locator('.home-searchable__index button').nth(2).click();
  const lens = page.locator('.home-searchable__evidence .data-lens');
  await expect(lens.locator('.data-lens__service')).toHaveCount(2);
  const columns = () =>
    lens
      .locator('.data-lens__service')
      .first()
      .evaluate((element) =>
        getComputedStyle(element).gridTemplateColumns.split(' ').map(parseFloat),
      );
  expect((await columns()).slice(0, 2)).toEqual([50, 80]);

  await lens.evaluate((element: HTMLElement) => {
    element.style.flex = 'none';
    element.style.width = '380px';
  });
  await expect.poll(async () => (await columns()).slice(0, 2)).toEqual([42, 60]);
  await expect(lens.locator('.data-lens__service').first()).toHaveCSS('font-size', '12px');
});

test('query fragment uses local content density inside a narrow desktop slot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const fragment = page.locator('.home-capabilities .query-fragment');
  await expect(fragment).toBeVisible();
  const code = fragment.locator('.query-fragment__options code').first();
  await expect(code).toHaveCSS('font-size', '12px');
  await fragment.evaluate((element: HTMLElement) => {
    element.style.width = '400px';
  });
  await expect(code).toHaveCSS('font-size', '10px');
});

test('monitoring asset selection follows the width of its panel', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./platform/monitoring');
  const assets = page.locator('.stage-monitor-assets').first();
  await expect(assets).toBeVisible();
  const list = assets.locator('.stage-monitor-assets__list');
  const columns = () => list.evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  await expect.poll(columns).toMatch(/repeat\(2/);
  await assets.evaluate((element: HTMLElement) => {
    element.style.width = '460px';
  });
  await expect.poll(columns).toBe('1fr');
  await expect(assets.locator('button')).toHaveCount(2);
});

for (const width of [320, 600, 768, 1200]) {
  test(`responsive content has no document overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 720 : 850 });
    for (const route of ['./', './platform/monitoring', './pricing']) {
      await page.goto(route);
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, `Unexpected horizontal overflow on ${route}`).toBeLessThanOrEqual(1);
    }
  });
}
