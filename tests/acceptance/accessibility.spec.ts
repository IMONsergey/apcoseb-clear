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
        const preparation: Record<string, unknown> = { phase: 'fonts', completed: false };
        const bounded = async <T>(pending: Promise<T>, label: string): Promise<T> => {
          let timer: ReturnType<typeof setTimeout> | undefined;
          try {
            return await Promise.race([
              pending,
              new Promise<never>((_, reject) => {
                timer = setTimeout(
                  () => reject(new Error(label + ' exceeded its 20s stage budget')),
                  20_000,
                );
              }),
            ]);
          } finally {
            if (timer) clearTimeout(timer);
          }
        };
        try {
          const fonts = await test.step('Wait for fonts before accessibility traversal', () =>
            bounded(
              page.evaluate(async () => {
                const started = performance.now();
                let timer: ReturnType<typeof setTimeout> | undefined;
                try {
                  await Promise.race([
                    document.fonts.ready,
                    new Promise<never>((_, reject) => {
                      timer = setTimeout(
                        () => reject(new Error('Font readiness exceeded 18s')),
                        18_000,
                      );
                    }),
                  ]);
                  return {
                    status: 'ready',
                    elapsedMs: performance.now() - started,
                    fontSetStatus: document.fonts.status,
                  };
                } catch (error) {
                  return {
                    status: 'not-ready',
                    elapsedMs: performance.now() - started,
                    fontSetStatus: document.fonts.status,
                    error: String(error),
                    pending: Array.from(document.fonts)
                      .filter((font) => font.status === 'loading')
                      .map((font) => ({ family: font.family, status: font.status })),
                  };
                } finally {
                  if (timer) clearTimeout(timer);
                }
              }),
              'Font readiness',
            ));
          preparation.fonts = fonts;
          expect(fonts.status, 'Font readiness must succeed; timeout never skips fonts').toBe(
            'ready',
          );
          preparation.phase = 'traversal';
          const traversal = await test.step('Traverse the current document to a stable end', () =>
            bounded(
              page.evaluate(async () => {
                const started = performance.now(),
                  deadline = started + 18_000;
                const samples: Array<{
                  elapsedMs: number;
                  height: number;
                  y: number;
                  viewport: number;
                  pendingImages: number;
                  fonts: string;
                  atEnd: boolean;
                }> = [];
                let y = 0,
                  iterations = 0,
                  maxHeight = 0,
                  lastHeight = -1,
                  stableSince: number | null = null;
                try {
                  while (performance.now() < deadline) {
                    const viewport = innerHeight;
                    if (!Number.isFinite(viewport) || viewport <= 0)
                      throw new Error('Invalid traversal viewport');
                    scrollTo({
                      top: Math.min(
                        y,
                        Math.max(0, document.documentElement.scrollHeight - viewport),
                      ),
                      behavior: 'instant',
                    });
                    await new Promise((resolve) => setTimeout(resolve, 40));
                    const height = document.documentElement.scrollHeight;
                    const pendingImages = Array.from(document.images).filter(
                      (image) =>
                        Boolean(image.currentSrc || image.getAttribute('src')) && !image.complete,
                    ).length;
                    const atEnd = scrollY + innerHeight >= height - 1;
                    const readyEnd =
                      atEnd && document.fonts.status === 'loaded' && pendingImages === 0;
                    if (!readyEnd || height !== lastHeight) stableSince = null;
                    if (readyEnd && stableSince === null) stableSince = performance.now();
                    iterations++;
                    maxHeight = Math.max(maxHeight, height);
                    samples.push({
                      elapsedMs: performance.now() - started,
                      height,
                      y: scrollY,
                      viewport: innerHeight,
                      pendingImages,
                      fonts: document.fonts.status,
                      atEnd,
                    });
                    if (samples.length > 12) samples.shift();
                    if (
                      readyEnd &&
                      stableSince !== null &&
                      performance.now() - stableSince >= 500
                    ) {
                      return {
                        status: 'complete',
                        elapsedMs: performance.now() - started,
                        iterations,
                        maxHeight,
                        finalHeight: height,
                        stableEndMs: performance.now() - stableSince,
                        samples,
                      };
                    }
                    lastHeight = height;
                    y = atEnd ? scrollY : scrollY + innerHeight;
                  }
                  return {
                    status: 'deadline',
                    elapsedMs: performance.now() - started,
                    iterations,
                    maxHeight,
                    samples,
                  };
                } finally {
                  scrollTo({ top: 0, behavior: 'instant' });
                }
              }),
              'Document traversal',
            ));
          preparation.traversal = traversal;
          expect(
            traversal.status,
            'The current document end must be reached and remain stable with fonts/images settled',
          ).toBe('complete');
          preparation.phase = 'complete';
          preparation.completed = true;
        } catch (error) {
          preparation.error = String(error);
          throw error;
        } finally {
          await info.attach('accessibility-preparation', {
            body: JSON.stringify(preparation, null, 2),
            contentType: 'application/json',
          });
        }
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
