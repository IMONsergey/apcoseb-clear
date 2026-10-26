import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';

for (const width of [390, 1440]) {
  test(`editorial introductions read in one direction at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const { path } of siteRoutes.filter(
      (r) => r.path !== '/' && !r.path.startsWith('/legal/'),
    )) {
      await page.goto('.' + path);
      await expect(page.locator('h1')).toBeVisible();
      const groups = await page.locator('.editorial-heading').evaluateAll((elements) =>
        elements
          .map((el) => {
            const title = el.querySelector('h2')!;
            const lead = el.querySelector('p');
            return lead
              ? {
                  left: lead.getBoundingClientRect().left - title.getBoundingClientRect().left,
                  gap: lead.getBoundingClientRect().top - title.getBoundingClientRect().bottom,
                  size: parseFloat(getComputedStyle(lead).fontSize),
                  titleSize: parseFloat(getComputedStyle(title).fontSize),
                }
              : null;
          })
          .filter(Boolean),
      );
      for (const group of groups) {
        expect(Math.abs(group!.left), path).toBeLessThanOrEqual(1);
        expect(group!.gap, path).toBeGreaterThanOrEqual(16);
        expect(group!.size, path).toBeGreaterThanOrEqual(18);
        expect(group!.titleSize / group!.size, path).toBeGreaterThan(1.5);
      }
      const rows = await page.locator('.reading-row').evaluateAll((elements) =>
        elements.map((el) => {
          const h = el.querySelector('h3')!.getBoundingClientRect();
          const p = el.querySelector('p')!;
          return {
            left: h.left - p.getBoundingClientRect().left,
            gap: p.getBoundingClientRect().top - h.bottom,
            size: parseFloat(getComputedStyle(p).fontSize),
          };
        }),
      );
      for (const row of rows) {
        expect(Math.abs(row.left), path).toBeLessThanOrEqual(1);
        expect(row.gap, path).toBeGreaterThanOrEqual(14);
        expect(row.size, path).toBeGreaterThanOrEqual(17);
      }
    }
  });
}

test('editorial images load responsively without shifting the text', async ({ page }) => {
  for (const path of ['/about', '/platform/data-methodology', '/responsible-scanning']) {
    await page.goto('.' + path);
    const image = page.locator('.editorial-media img');
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    await expect(image).toHaveAttribute('alt', /\S/);
    const before = await image.boundingBox();
    await expect(image).toHaveAttribute('loading', 'lazy');
    expect(before!.height).toBeLessThanOrEqual(350);
    await page.setViewportSize({ width: 390, height: 844 });
    const imageBox = await image.boundingBox();
    const titleBox = await page
      .locator('.editorial-opening--illustrated .editorial-heading')
      .boundingBox();
    expect(imageBox!.y).toBeGreaterThan(titleBox!.y + titleBox!.height);
    await page.setViewportSize({ width: 1280, height: 900 });
  }
});

test('reading surfaces retain symmetric space and readable body copy', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const { path, surfaceSelector, copySelector } of [
      {
        path: '/teams',
        surfaceSelector: '.handoff-record',
        copySelector: '.team-handoff > div > p',
      },
      {
        path: '/platform/data-methodology',
        surfaceSelector: '.date-reading',
        copySelector: '.collection-layout > article > p',
      },
      {
        path: '/use-cases/osint-threat-investigation',
        surfaceSelector: '.investigation-notebook',
        copySelector: '.indicator-approach article p',
      },
    ]) {
      await page.goto('.' + path);
      const surface = page.locator(surfaceSelector);
      const bodyCopy = page.locator(copySelector);
      await expect(surface.first()).toBeVisible();
      await expect(bodyCopy.first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const surfaces = await surface.evaluateAll((els) =>
        els.map((el) => {
          const css = getComputedStyle(el);
          return { left: parseFloat(css.paddingLeft), right: parseFloat(css.paddingRight) };
        }),
      );
      expect(surfaces.length, path).toBeGreaterThan(0);
      for (const box of surfaces) {
        expect(box.left, path).toBeGreaterThanOrEqual(22);
        expect(Math.abs(box.left - box.right), path).toBeLessThanOrEqual(1);
      }
      const copy = await bodyCopy.evaluateAll((els) =>
        els.map((el) => parseFloat(getComputedStyle(el).fontSize)),
      );
      expect(copy.length, path).toBeGreaterThan(0);
      for (const size of copy) expect(size, path).toBeGreaterThanOrEqual(width > 1000 ? 18 : 17);
    }
  }
});
