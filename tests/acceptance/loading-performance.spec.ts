import { expect, test } from '@playwright/test';

test('Russian page styles and display fonts start before application code is available', async ({
  page,
}) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(new URL(request.url()).pathname));
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/assets\/index-[\w-]+\.js$/, async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.goto('./ru/about/', { waitUntil: 'commit' });
    await expect(page.locator('script[type="module"][src]')).toHaveAttribute(
      'fetchpriority',
      'high',
    );
    await expect(
      page.locator('link[rel="modulepreload"], link[rel="preload"][as="script"]'),
    ).toHaveCount(0);
    await expect
      .poll(() => requested.some((url) => /CorporatePages-[\w-]+\.css$/.test(url)))
      .toBe(true);
    await expect
      .poll(() => requested.some((url) => url.endsWith('/fonts/onest-cyrillic.woff2')))
      .toBe(true);
    release();
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('main')).toHaveAttribute('data-route', '/about');
  } finally {
    release();
  }
});

test('early resource hints do not transfer the same JavaScript twice', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Check resource transfer accounting in Chromium.');
  await page.goto('./ru/');
  await expect(page.locator('main h1')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const duplicates = await page.evaluate(() => {
    const transfers = new Map<string, number>();
    for (const item of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
      if (!new URL(item.name).pathname.endsWith('.js') || item.transferSize === 0) continue;
      transfers.set(item.name, (transfers.get(item.name) ?? 0) + 1);
    }
    return [...transfers].filter(([, count]) => count > 1);
  });
  expect(duplicates).toEqual([]);
});

for (const path of ['./', './about/', './legal/privacy-policy/']) {
  test(`footer actions appear only after delayed page content commits: ${path}`, async ({
    page,
  }) => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/\/(?:HomePage|CorporatePages|LegalPages)-[\w-]+\.js$/, async (route) => {
      await held;
      await route.continue();
    });
    try {
      const navigation = page.goto(path);
      await expect(page.locator('main .route-fallback')).toBeVisible();
      await expect(page.locator('footer')).toHaveCount(0);
      release();
      await navigation;
      await expect(page.locator('main h1')).toBeVisible();
      await page.getByRole('button', { name: 'Cookie Preferences' }).click();
      const dialog = page.getByRole('dialog', { name: 'Cookie Preferences' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Save Preferences' }).click();
      await expect(dialog).toBeHidden();
    } finally {
      release();
    }
  });
}

for (const width of [390, 1280]) {
  test(`delayed related artwork preserves footer geometry and pointer activation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 720 });
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested = 0;
    await page.route(/\/assets\/inner\/(?:search|methodology)\.webp$/, async (route) => {
      requested += 1;
      await held;
      await route.continue();
    });
    try {
      await page.goto('./about/');
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const images = page.locator('.related-reading img');
      await expect(images).toHaveCount(2);
      await page.locator('.related-reading').scrollIntoViewIfNeeded();
      await expect.poll(() => requested).toBe(2);

      const trigger = page.getByRole('button', { name: 'Cookie Preferences' });
      await trigger.scrollIntoViewIfNeeded();
      const geometry = () =>
        page.locator('.related-reading, .stage-related, footer').evaluateAll((elements) =>
          elements.map((element) => {
            const rect = element.getBoundingClientRect();
            return { top: rect.top + scrollY, height: rect.height };
          }),
        );
      const before = await geometry();
      const button = (await trigger.boundingBox())!;
      await page.mouse.move(button.x + button.width / 2, button.y + button.height / 2);
      await page.mouse.down();
      release();
      await images.evaluateAll((elements) =>
        Promise.all(elements.map((element) => (element as HTMLImageElement).decode())),
      );
      const after = await geometry();
      await page.mouse.up();

      for (let i = 0; i < before.length; i++) {
        expect(
          Math.abs(after[i]!.top - before[i]!.top),
          'Image loading moves content',
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(after[i]!.height - before[i]!.height),
          'Image loading resizes content',
        ).toBeLessThanOrEqual(1);
      }
      const dialog = page.getByRole('dialog', { name: 'Cookie Preferences' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Save Preferences' }).click();
      await expect(dialog).toBeHidden();
    } finally {
      release();
    }
  });
}

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
      /\/(?:HomePage|PageFrame|ThemedArtwork|evidencePlayback|gsap|applicationPlayback)-/.test(
        path,
      ),
    ),
  ).toEqual([]);
});
