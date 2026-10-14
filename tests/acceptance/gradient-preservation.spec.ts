import { expect, test } from '@playwright/test';
import { wcagAxe } from '../helpers/accessibility';

const spacing = `* { line-height: 1.5 !important; letter-spacing: .12em !important;
  word-spacing: .16em !important; } p { margin-bottom: 2em !important; }`;

test('WCAG scan catches unrelated violations as well as visible label mismatch', async ({
  page,
}) => {
  await page.goto('./');
  await page.setContent(
    '<html lang="en"><head><title>Scanner control</title></head><body><main>' +
      '<button style="width:60px;height:60px"></button>' +
      '<button aria-label="Delete item">Save changes</button></main></body></html>',
  );
  const results = await wcagAxe(page).analyze();
  const ids = results.violations.map((violation) => violation.id);
  expect(ids).toContain('button-name');
  expect(ids).toContain('label-content-name-mismatch');
});

for (const theme of ['light', 'dark']) {
  for (const width of [1200, 1280, 1440]) {
    test(`desktop header fits user text spacing in ${theme} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((value) => localStorage.setItem('apcosys-theme-mode', value), theme);
      await page.goto('./');
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: spacing });
      const boxes = await page
        .locator('.site-header a:visible, .site-header button:visible')
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const r = node.getBoundingClientRect();
            return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height };
          }),
        );
      for (const box of boxes) {
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
        expect(box.height).toBeGreaterThan(0);
      }
      await expect(
        page.locator('.site-header').getByRole('link', { name: 'Try Search', exact: true }),
      ).toBeVisible();
    });
  }
}

for (const width of [390, 1440]) {
  test(`dark flow uses the supplied opaque lower palette at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('apcosys-theme-mode', 'dark'));
    await page.goto('./');
    const canvas = page.locator('.search-preview .turquoise-flow canvas');
    await expect(canvas).toHaveAttribute('data-render-ready', 'frame');
    const rows = await canvas.evaluate((node) => {
      const canvas = node as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      return [0.65, 0.8, 1].map((fraction) => {
        const y = Math.min(canvas.height - 1, Math.floor(canvas.height * fraction));
        return [...ctx.getImageData(0, y, canvas.width, 1).data];
      });
    });
    for (const row of rows) {
      // Canvas gradient dithering can differ by one channel value across a row.
      for (let x = 0; x < row.length; x += 4) {
        for (let channel = 0; channel < 4; channel++) {
          const value = row[x + channel];
          const reference = row[channel];
          if (value === undefined || reference === undefined)
            throw new Error('Missing canvas pixel');
          expect(Math.abs(value - reference)).toBeLessThanOrEqual(1);
        }
      }
    }
    expect(rows[2]?.slice(0, 4)).toEqual([12, 17, 19, 255]);
    await page.evaluate(() => {
      localStorage.setItem('apcosys-theme-mode', 'light');
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'apcosys-theme-mode', newValue: 'light' }),
      );
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect
      .poll(() =>
        canvas.evaluate((node) => {
          const c = node as HTMLCanvasElement;
          return [...c.getContext('2d')!.getImageData(0, c.height - 1, 1, 1).data];
        }),
      )
      .toEqual([246, 246, 246, 255]);
  });
}

test('dark flow CSS fallback has the same supplied palette if its chunk fails', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('apcosys-theme-mode', 'dark'));
  await page.route(/TurquoiseFlow-.*\.js/, (route) => route.abort());
  await page.goto('./');
  const fallback = page.locator('.search-preview .visual-fallback--flow');
  await expect(fallback).toBeVisible();
  const paint = await fallback.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(paint).toContain('rgb(12, 17, 19) 98%');
  expect(paint).toContain('rgb(0, 122, 146) 60%');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
