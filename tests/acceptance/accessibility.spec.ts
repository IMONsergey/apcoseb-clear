import { expect, test } from '@playwright/test';
import { wcagAxe } from '../helpers/accessibility';
import { siteVariants } from '../helpers/site-variants';

// Each case owns its browser context and report; share the existing CI worker pool.
test.describe.configure({ mode: 'parallel' });

test('accessibility audit retains WCAG filtering and visible-label checks', async ({ page }) => {
  await page.setContent(`
    <!doctype html><html lang="en"><head><title>Accessibility fixture</title></head>
    <body><main>
      <button aria-label="Confirm">Save</button>
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E">
    </main></body></html>
  `);
  const { violations } = await wcagAxe(page).analyze();
  const rules = violations.map(({ id }) => id);
  expect(rules).toContain('image-alt');
  expect(rules).toContain('label-content-name-mismatch');
  expect(rules).not.toContain('page-has-heading-one');
});

for (const route of siteVariants) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [390, 1440]) {
      test(`Accessibility and assets ${route.path} ${theme} ${width}px`, async ({ page }, info) => {
        test.setTimeout(90_000);
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('response', (response) => {
          if (
            response.status() >= 400 &&
            !(
              route.notFound &&
              response.status() === 404 &&
              response.request().isNavigationRequest()
            ) &&
            new URL(response.url()).origin === new URL(page.url()).origin
          )
            errors.push(`${response.status()} ${response.url()}`);
        });
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript((mode) => localStorage.setItem('apcosys-theme-mode', mode), theme);
        await page.goto('.' + route.path, { waitUntil: 'networkidle' });
        await expect(page.locator('html')).toHaveAttribute('lang', route.locale);
        await expect(page.locator('main h1')).toBeVisible();
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
}
