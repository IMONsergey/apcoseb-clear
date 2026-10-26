import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';

const locales = [
  { path: '', lang: 'en' },
  { path: 'ru/', lang: 'ru' },
  { path: 'zh-hant/', lang: 'zh-Hant' },
] as const;

for (const locale of locales) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [320, 768, 1440]) {
      test(`every route retains readable layout: ${locale.lang} ${theme} ${width}px`, async ({
        page,
      }) => {
        test.setTimeout(120_000);
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript((mode) => localStorage.setItem('apcosys-theme-mode', mode), theme);
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        for (const { path } of siteRoutes) {
          const context = `${locale.lang} ${theme} ${width}px ${path}`;
          await page.goto(`./${locale.path}${path.replace(/^\//, '')}`);
          await expect(page.locator('main h1'), context).toHaveCount(1);
          await expect(page.locator('main h1'), context).toBeVisible();
          await expect(page.locator('html'), context).toHaveAttribute('lang', locale.lang);
          await expect(page.locator('html'), context).toHaveAttribute('data-theme', theme);
          await page.evaluate(() => document.fonts.ready);
          const layout = await page.evaluate(() => {
            const headings = Array.from(
              document.querySelectorAll(
                'main h1, .editorial-heading h2, .stage-workbench__intro h2, .stage-monitor-concept__heading h2',
              ),
            );
            const clipped = headings.flatMap((heading) => {
              // The Home heading has an intentional optical left offset. Its own
              // text box, bounded by the viewport, is the relevant reading rail.
              const box = heading.getBoundingClientRect();
              const range = document.createRange();
              range.selectNodeContents(heading);
              return [...range.getClientRects()].some(
                (rect) =>
                  rect.width > 0 &&
                  (rect.left < Math.max(0, box.left) - 1 ||
                    rect.right > Math.min(innerWidth, box.right) + 1),
              )
                ? [heading.textContent]
                : [];
            });
            const brokenImages = Array.from(document.querySelectorAll<HTMLImageElement>('main img'))
              .filter((image) => image.complete && image.currentSrc && !image.naturalWidth)
              .map((image) => image.getAttribute('src'));
            return {
              overflow: document.documentElement.scrollWidth - innerWidth,
              clipped,
              brokenImages,
            };
          });
          expect.soft(layout.overflow, context).toBeLessThanOrEqual(1);
          expect.soft(layout.clipped, context).toEqual([]);
          expect.soft(layout.brokenImages, context).toEqual([]);
          expect.soft(errors, context).toEqual([]);
        }
      });
    }
  }
}
