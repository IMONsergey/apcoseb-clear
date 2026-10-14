import { expect, test } from '@playwright/test';

// Delay route code deliberately: a fast development machine must not hide a collapsing fallback.
for (const width of [390, 1440]) {
  for (const path of ['./', './about/', './legal/privacy-policy/']) {
    test(`cold load keeps the first screen stable: ${path} at ${width}px`, async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== 'chromium', 'Layout Instability API is Chromium-only.');
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.addInitScript(() => {
        const shifts: { time: number; value: number }[] = [];
        Object.assign(window, { __loadShifts: shifts });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
            if (!shift.hadRecentInput) shifts.push({ time: shift.startTime, value: shift.value });
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.route(/\/(?:HomePage|CorporatePages|LegalPages)-[\w-]+\.js$/, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 350));
        await route.continue();
      });
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200);
      const cls = await page.evaluate(() => {
        const shifts = (window as unknown as { __loadShifts: { time: number; value: number }[] })
          .__loadShifts;
        let start = 0,
          last = 0,
          sum = 0,
          max = 0;
        for (const shift of shifts) {
          if (shift.time - last > 1000 || shift.time - start > 5000) {
            start = shift.time;
            sum = 0;
          }
          sum += shift.value;
          last = shift.time;
          max = Math.max(max, sum);
        }
        return max;
      });
      expect(
        cls,
        'Cold-load CLS must stay below 0.05, including delayed route download',
      ).toBeLessThanOrEqual(0.05);
    });
  }
}

test('Legal loads without homepage, product artwork or animation engines', async ({ page }) => {
  const assets: string[] = [];
  page.on('request', (request) => assets.push(new URL(request.url()).pathname));
  await page.goto('./legal/privacy-policy/');
  await expect(page.locator('main h1')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  expect(
    assets.filter((path) =>
      /\/(?:HomePage|PageFrame|ThemedArtwork|evidencePlayback|gsap|theme-demos)-/.test(path),
    ),
  ).toEqual([]);
});
