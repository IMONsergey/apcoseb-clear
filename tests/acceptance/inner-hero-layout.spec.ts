import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';

const innerRoutes = siteRoutes.filter(({ path }) => path !== '/' && !path.startsWith('/legal/'));

// Include both sides of the stacking/type breakpoints and narrow CTA wrapping.
for (const width of [320, 360, 390, 480, 600, 767, 768, 1000, 1001, 1280, 1440, 1920]) {
  test(`internal first blocks share one height at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    const heights: number[] = [];
    const artworkHeights: number[] = [];
    const sectionStarts: number[] = [];
    for (const route of innerRoutes) {
      await page.goto('.' + route.path);
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => {
        const hero = document.querySelector('.stage-page-hero')!;
        const rect = hero.getBoundingClientRect();
        const copy = hero.querySelector('.stage-page-hero__copy')!.getBoundingClientRect();
        const art = hero.querySelector('.page-artwork')!.getBoundingClientRect();
        const bounds = [...hero.querySelectorAll('h1, p, a, .page-artwork')].map((el) => {
          const box = el.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
        });
        return {
          height: rect.height,
          top: rect.top,
          bottom: rect.bottom,
          artHeight: art.height,
          gap: innerWidth < 768 ? art.top - copy.bottom : art.left - copy.right,
          nextTop: hero.nextElementSibling!.getBoundingClientRect().top,
          overflow: document.documentElement.scrollWidth - innerWidth,
          bounds,
        };
      });
      heights.push(geometry.height);
      artworkHeights.push(geometry.artHeight);
      sectionStarts.push(geometry.nextTop);
      expect(geometry.overflow, route.path).toBeLessThanOrEqual(1);
      expect(geometry.gap, `${route.path}: copy and art separation`).toBeGreaterThanOrEqual(19);
      for (const box of geometry.bounds) {
        expect(box.top, route.path).toBeGreaterThanOrEqual(geometry.top);
        expect(box.bottom, route.path).toBeLessThanOrEqual(geometry.bottom);
        expect(box.left, route.path).toBeGreaterThanOrEqual(0);
        expect(box.right, route.path).toBeLessThanOrEqual(width);
      }
    }
    expect(Math.max(...heights) - Math.min(...heights), 'hero height spread').toBeLessThan(1);
    expect(
      Math.max(...artworkHeights) - Math.min(...artworkHeights),
      'art size spread',
    ).toBeLessThan(1);
    expect(
      Math.max(...sectionStarts) - Math.min(...sectionStarts),
      'next-section start spread',
    ).toBeLessThan(1);
  });
}

for (const width of [320, 1440]) {
  test(`hero accommodates double-sized text at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./platform/monitoring');
    await expect(page.locator('main h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const before = await page.locator('.stage-page-hero').boundingBox();
    // Simulate text-only enlargement, leaving the viewport and illustration unchanged.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll<HTMLElement>(
        '.stage-page-hero h1, .stage-page-hero p, .stage-page-hero .double-button',
      )) {
        el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 2}px`;
      }
    });
    const after = await page.locator('.stage-page-hero').boundingBox();
    expect(after!.height).toBeGreaterThan(before!.height);
    const copy = await page.locator('.stage-page-hero__copy').boundingBox();
    const art = await page.locator('.stage-page-hero .page-artwork').boundingBox();
    expect(copy!.y + copy!.height).toBeLessThan(after!.y + after!.height);
    if (width < 768) expect(art!.y).toBeGreaterThanOrEqual(copy!.y + copy!.height + 19);
    await expect(page.locator('.stage-page-hero')).not.toHaveCSS('overflow', 'hidden');
  });
}
