import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';
import { wcagAxe } from '../helpers/accessibility';

for (const route of siteRoutes) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Accessibility and assets ${route.path} ${theme}`, async ({ page }, info) => {
      test.setTimeout(90_000);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (
          response.status() >= 400 &&
          new URL(response.url()).origin === new URL(page.url()).origin
        )
          errors.push(`${response.status()} ${response.url()}`);
      });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.addInitScript((mode) => localStorage.setItem('apcosys-theme-mode', mode), theme);
      await page.goto('.' + route.path, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        await document.fonts.ready;
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
          scrollTo({ top: y, behavior: 'instant' });
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
        scrollTo({ top: 0, behavior: 'instant' });
      });
      expect(errors).toEqual([]);
      const brokenImages = await page
        .locator('img')
        .evaluateAll((images: HTMLImageElement[]) =>
          images
            .filter((image) => image.complete && image.naturalWidth === 0)
            .map((image) => image.src),
        );
      expect(brokenImages).toEqual([]);
      const result = await wcagAxe(page).analyze();
      await info.attach('accessibility-results', {
        body: JSON.stringify(
          { violations: result.violations, incomplete: result.incomplete },
          null,
          2,
        ),
        contentType: 'application/json',
      });
      expect(
        result.violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map((node) => node.target),
        })),
      ).toEqual([]);
    });
  }
}
