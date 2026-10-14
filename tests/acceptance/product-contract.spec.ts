import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('home contains all new content, five animated scenes, one set of coverage figures', async ({
  page,
}) => {
  await page.goto('./');
  for (const id of ['what-you-can-search', 'use-cases', 'capabilities'])
    await expect(page.locator('#' + id)).toBeVisible();
  await expect(page.locator('.home-team-cta')).toContainText('Evaluating Apcosys');
  await expect(page.locator('.step-illustration')).toHaveCount(5);
  await expect(page.locator('.step-illustration').nth(3)).toHaveAttribute(
    'aria-label',
    /technical context/,
  );
  await expect(page.locator('.summary-grid')).toContainText('CVE Associations');
  await expect(page.locator('.data-section')).not.toContainText('88 585 365');
  await page.locator('.home-capabilities__tabs').getByRole('button', { name: 'Filter' }).click();
  const filter = page.getByRole('checkbox', { name: 'HTTPS only' });
  await filter.check();
  await expect(page.locator('.home-capabilities__screen')).not.toContainText('HTTPS redirect');
  await filter.uncheck();
  await expect(page.locator('.home-capabilities__screen')).toContainText('HTTPS redirect');
  await expect(page.locator('.api-section .api-demo-frame')).toBeVisible();
});

for (const width of [320, 390, 599, 768]) {
  test(
    'mobile investigation active tab and search content remain visible at ' + width,
    async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('./platform/search-investigation');
      const nav = page.locator('.stage-workbench__steps');
      const first = nav.getByRole('tab').first();
      expect(await nav.evaluate((e) => e.scrollLeft)).toBe(0);
      await first.focus();
      await first.press('End');
      const last = nav.getByRole('tab').last();
      await expect(last).toBeFocused();
      await expect(last).toHaveAttribute('aria-selected', 'true');
      const n = await nav.boundingBox(),
        a = await last.boundingBox();
      expect(a!.x).toBeGreaterThanOrEqual(n!.x - 1);
      expect(a!.x + a!.width).toBeLessThanOrEqual(n!.x + n!.width + 1);
      await last.press('Home');
      expect(await nav.evaluate((e) => e.scrollLeft)).toBeLessThanOrEqual(1);
      await page.goto('./');
      const scene = page.locator('.search-scene');
      await scene.scrollIntoViewIfNeeded();
      // The original chrome's fog intentionally extends outside the scene.
      // Check the usable content instead, including its inner overflow and frame bounds.
      const frame = await scene.boundingBox();
      for (const selector of ['.search-scene__heading', '.search-form', '.search-scene__results']) {
        const content = scene.locator(selector);
        const box = await content.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(frame!.x - 1);
        expect(box!.x + box!.width).toBeLessThanOrEqual(frame!.x + frame!.width + 1);
        if (selector === '.search-form') {
          // The approved invitation halo extends 4px outside the field. Measure
          // actual controls independently so decorative overflow cannot conceal
          // clipped inputs or buttons (or trigger a false content-overflow failure).
          for (const control of await content.locator('input, button:visible').all()) {
            const controlBox = await control.boundingBox();
            expect(controlBox!.x).toBeGreaterThanOrEqual(box!.x - 1);
            expect(controlBox!.x + controlBox!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
          }
        } else {
          const spill = await content.evaluate((el) => el.scrollWidth - el.clientWidth);
          expect(spill).toBeLessThanOrEqual(1);
        }
      }
      await expect(page.locator('.search-scene__results .product-evidence__details')).toBeVisible();
    },
  );
}

test('mobile billing never covers a plan price or CTA while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./pricing');
  const range = await page.locator('.plan-grid').boundingBox();
  for (let y = range!.y - 400; y < range!.y + range!.height; y += 100) {
    await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(60);
    const overlaps = await page.evaluate(() => {
      const d = document.querySelector<HTMLElement>('.billing-dock')!;
      if (getComputedStyle(d).visibility === 'hidden') return [];
      const r = d.getBoundingClientRect();
      return [...document.querySelectorAll('.plan-price-block,.plan-button,.stage-plan-contact')]
        .filter((el) => {
          const e = el.getBoundingClientRect();
          return e.bottom > r.top && e.top < r.bottom && e.right > r.left && e.left < r.right;
        })
        .map((e) => e.textContent);
    });
    expect(overlaps).toEqual([]);
  }
});

test('mobile billing dock is suspended while a pricing dialog is open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./pricing');
  await page.locator('#plan-plus .plan-button').click();
  const dialog = page.getByRole('dialog', { name: 'PLUS plan' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-billing-dock', 'visible');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(dialog).not.toBeVisible();
});

test('API response is collapsed initially and clipboard gives useful feedback', async ({
  page,
  context,
  browserName,
}) => {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./developers/api');
  const code = page.locator('.stage-code-window');
  await expect(code.locator('pre')).not.toContainText('198.51.100.24');
  await code.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(code.getByRole('button', { name: /Copied|Selected/ })).toBeVisible();
  if (browserName === 'chromium')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      'APCOSYS_API_ENDPOINT',
    );
  await code.getByRole('button', { name: 'Response', exact: true }).click();
  await expect(code.locator('pre')).toContainText('198.51.100.24');
});

test('Monitoring carries selected synthetic host into investigation', async ({ page }) => {
  await page.goto('./platform/monitoring');
  await page.locator('.stage-monitor-assets__list button').nth(1).click();
  await page.locator('.stage-monitor-console__nav').last().click();
  await page.locator('.stage-monitor-console__link').click();
  await expect(page.locator('.product-evidence__details h3')).toContainText('203.0.113.42');
});

test('new components have no decorative unicode arrows', () => {
  for (const path of [
    'src/components/product/ProductEvidence.tsx',
    'src/components/product/InvestigationWorkbench.tsx',
    'src/components/product/MonitoringConcept.tsx',
    'src/components/sections/HomeProductSections.tsx',
    'src/components/sections/SearchPreview.tsx',
  ])
    expect(readFileSync(path, 'utf8')).not.toMatch(/[↗→]/);
});
