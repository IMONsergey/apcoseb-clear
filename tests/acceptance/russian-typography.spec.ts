import { expect, test } from '@playwright/test';
import { formatTypography } from '../../src/i18n/typography';
import { localizedRoutes } from '../../src/i18n/localized-routes';

test('Russian prose uses locale-specific typography without changing technical tokens', () => {
  expect(formatTypography('Это - пример "кавычек" и переносов.', 'ru')).toBe(
    'Это\u00a0— пример «кавычек» и\u00a0переносов.',
  );
  expect(formatTypography('Доступ к данным для всех клиентов', 'ru')).toBe(
    'Доступ к\u00a0данным для\u00a0всех клиентов',
  );
  expect(formatTypography('CVE-2024-1234', 'ru')).toBe('CVE-2024-1234');
  expect(formatTypography('192.168.1.1', 'ru')).toBe('192.168.1.1');
  expect(formatTypography('接口数据', 'zh-Hant')).toBe('接口数据');
  expect(formatTypography('Результат - это вывод', 'ru')).toBe(
    formatTypography(formatTypography('Результат - это вывод', 'ru'), 'ru'),
  );
});

test('Russian display face loads from the local font bundle', async ({ page, baseURL }) => {
  const fontRequests: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fontRequests.push(request.url());
  });
  await page.goto('./ru/');
  await page.evaluate(async () => {
    await document.fonts.load('500 48px "Onest"', 'Исследование');
  });
  const family = await page
    .locator('.hero h1')
    .evaluate((element) => getComputedStyle(element).fontFamily);
  expect(family).toContain('Onest');
  expect(fontRequests.some((url) => url.endsWith('/fonts/onest-cyrillic.woff2'))).toBe(true);
  expect(fontRequests.every((url) => url.startsWith(new URL('fonts/', baseURL).href))).toBe(true);
});

for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
  test(`Russian headings stay inside their columns at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of localizedRoutes) {
      await page.goto(`./ru${route}`);
      const main = page.locator('main');
      await expect(main).toHaveAttribute('data-route', route);
      await expect(main.locator('h1')).toBeVisible();
      await expect(main.locator('.route-fallback, .route-error')).toHaveCount(0);
      if (route.startsWith('/legal/')) {
        await expect(main.locator('.legal-copy')).toBeVisible();
      }
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => ({
        documentOverflow: document.documentElement.scrollWidth - innerWidth,
        textOverflows: [...document.querySelectorAll('main h1, main h2, main h3, main p')]
          .filter(
            (node) =>
              !node.closest('[inert], [aria-hidden="true"], .sr-only') &&
              (node as HTMLElement).clientWidth > 0 &&
              (node as HTMLElement).scrollWidth > (node as HTMLElement).clientWidth + 2,
          )
          .map((node) => node.textContent?.slice(0, 70)),
      }));
      expect(layout.documentOverflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
      expect(layout.textOverflows, `${route} at ${width}px`).toEqual([]);

      if (route === '/') {
        const clippedCarouselWords = await page.locator('.step-copy h3').evaluateAll((headings) => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas text measurement is unavailable');
          return headings.flatMap((heading) => {
            const style = getComputedStyle(heading);
            context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            const maxWord = Math.max(
              ...((heading.textContent ?? '').match(/\S+/g) ?? []).map(
                (word) => context.measureText(word).width,
              ),
            );
            return maxWord > heading.clientWidth + 1 ? [heading.textContent] : [];
          });
        });
        expect(clippedCarouselWords, `Carousel titles at ${width}px`).toEqual([]);
      }
    }
  });
}
