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
    /Host\s+TLS\s+certificate\s+with\s+its\s+issuer,\s+validity\s+period\s+and\s+DNS\s+name/,
  );
  await expect(page.locator('.summary-grid')).toContainText('CVEs');
  await expect(page.locator('.summary-source a')).toHaveAttribute(
    'href',
    'https://api.apcosys.net/api/statistics',
  );
  await expect(page.locator('.data-section')).not.toContainText('88 585 365');
  await page
    .locator('#capabilities')
    .getByRole('button', { name: /Buckets/ })
    .click();
  const collection = page.locator('#capabilities .home-capabilities__stage:visible');
  await expect(collection).toContainText(
    'Group matching files by bucket and inspect their metadata.',
  );
  await expect(collection.locator('.capability-record__bar')).toContainText('Example bucket');
  await expect(collection.locator('.capability-record__bar')).toContainText(
    'storage.example.com/public',
  );
  await expect(collection.locator('.capability-record__host')).toHaveCount(2);
  await expect(collection.locator('.capability-record__host').nth(0)).toContainText(
    'reports/2026/summary.csv',
  );
  await expect(collection.locator('.capability-record__host').nth(0)).toContainText('CSV');
  await expect(collection.locator('.capability-record__host').nth(0)).toContainText('1.2 MB');
  await expect(collection.locator('.capability-record__host').nth(1)).toContainText(
    'exports/hosts.ndjson',
  );
  await expect(collection.locator('.capability-record__host').nth(1)).toContainText('NDJSON');
  await expect(collection.locator('.capability-record__host').nth(1)).toContainText('15.8 MB');
  await expect(collection.getByRole('link', { name: 'Explore bucket search' })).toHaveAttribute(
    'href',
    /\/developers\/api#api-capabilities$/,
  );
  await expect(page.locator('main .home-capabilities__tabs button')).toHaveCount(5);
  await expect(page.locator('main > #audiences')).toBeVisible();
  await expect(page.locator('#audiences .audience-art')).toHaveCount(2);
  const sequence = await page
    .locator('main section')
    .evaluateAll((sections) => sections.map((section) => section.id || section.classList[0]));
  expect(sequence).toEqual([
    'hero',
    'search-preview',
    'what-you-can-search',
    'how-it-works',
    'use-cases',
    'capabilities',
    'audiences',
    'data',
    'api',
    'pricing',
    'home-team-cta',
    'faq',
    'closing-section',
  ]);
  await expect(page.locator('.api-section .api-demo-frame')).toBeVisible();
});

for (const locale of ['', 'ru/', 'zh-hant/']) {
  test(`${locale || 'en'} investigation fits the complete desktop workbench within 650px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`./${locale}platform/search-investigation`);
    await page.evaluate(() => document.fonts.ready);
    const workbench = page.locator('.stage-workbench');
    await expect(workbench.locator('.stage-workbench__step')).toHaveCount(3);
    for (const step of await workbench.locator('.stage-workbench__step').all()) {
      await step.click();
      await expect(step).toHaveAttribute('aria-selected', 'true');
      const height = (await workbench.boundingBox())!.height;
      expect(
        height,
        'the full section includes its heading, controls, active scene and footnotes',
      ).toBeLessThanOrEqual(650);
    }
    await workbench.locator('.investigation-detail-tabs button').last().click();
    expect((await workbench.boundingBox())!.height).toBeLessThanOrEqual(650);
    await expect(workbench.locator('.investigation-tls')).toBeVisible();
  });
}

for (const width of [320, 390, 599, 768, 1024]) {
  test(
    'compact investigation active tab and search content remain visible at ' + width,
    async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('./platform/search-investigation');
      const nav = page.locator('.stage-workbench__steps');
      const layout = await page.locator('.stage-workbench__stage').evaluate((stage) => {
        const navigation = stage.querySelector('.stage-workbench__steps')!;
        const navBox = navigation.getBoundingClientRect();
        const viewerBox = stage.querySelector('.stage-workbench__viewer')!.getBoundingClientRect();
        return {
          width: stage.clientWidth,
          navWidth: navBox.width,
          viewerWidth: viewerBox.width,
          queryOverflow:
            stage.querySelector('.stage-workbench__viewer')!.scrollWidth -
            stage.querySelector('.stage-workbench__viewer')!.clientWidth,
          viewerClearance: viewerBox.top - navBox.bottom,
          tabTops: [...navigation.querySelectorAll('[role="tab"]')].map(
            (tab) => tab.getBoundingClientRect().top,
          ),
        };
      });
      // Compact layouts keep one horizontal step row above the full-width record.
      // This also guards the tablet breakpoint against a leftover desktop sidebar.
      expect(Math.abs(layout.navWidth - layout.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(layout.viewerWidth - layout.width)).toBeLessThanOrEqual(1);
      expect(
        layout.queryOverflow,
        'the query field and example actions fit their viewport',
      ).toBeLessThanOrEqual(1);
      expect(layout.viewerClearance).toBeGreaterThanOrEqual(-1);
      expect(Math.max(...layout.tabTops) - Math.min(...layout.tabTops)).toBeLessThanOrEqual(1);
      const first = nav.getByRole('tab').first();
      expect(await nav.evaluate((e) => e.scrollLeft)).toBe(0);
      await first.focus();
      await first.press('End');
      const last = nav.getByRole('tab').last();
      await expect(last).toBeFocused();
      await expect(last).toHaveAttribute('aria-selected', 'true');
      for (const selector of [
        '.stage-workbench__viewer',
        '.investigation-host__services',
        '.investigation-service-detail__body',
      ]) {
        const spill = await page
          .locator(selector)
          .evaluate((element) => element.scrollWidth - element.clientWidth);
        expect(spill, selector + ' has no clipped service content').toBeLessThanOrEqual(1);
      }
      await expect(page.locator('.investigation-service-detail__body pre')).toHaveCSS(
        'font-size',
        '14px',
      );
      const n = await nav.boundingBox(),
        a = await last.boundingBox();
      expect(a!.x).toBeGreaterThanOrEqual(n!.x - 1);
      expect(a!.x + a!.width).toBeLessThanOrEqual(n!.x + n!.width + 1);
      await last.press('Home');
      expect(await nav.evaluate((e) => e.scrollLeft)).toBeLessThanOrEqual(1);
      await nav.getByRole('tab').nth(1).click();
      const resultOverflow = await page
        .locator('.stage-workbench__viewer')
        .evaluate((element) => element.scrollWidth - element.clientWidth);
      expect(resultOverflow, 'results reflow without a clipped desktop table').toBeLessThanOrEqual(
        1,
      );
      await expect(page.locator('.investigation-result')).toHaveCount(2);
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
          // Controls must fit the field independently of its focus indicator.
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
  await expect(code.locator('pre')).not.toContainText('203.0.113.10');
  await code.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(code.getByRole('button', { name: /Copied|Selected/ })).toBeVisible();
  if (browserName === 'chromium')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      'https://api.apcosys.net/api/v1/search/hosts',
    );
  await code.getByRole('button', { name: 'Response', exact: true }).click();
  await expect(code.locator('pre')).toContainText('203.0.113.10');
});

test('Monitoring carries selected synthetic host into investigation', async ({ page }) => {
  await page.goto('./platform/monitoring');
  await page.locator('.stage-monitor-assets__list button').nth(1).click();
  await page.locator('.stage-monitor-console__nav').last().click();
  await page.locator('.stage-monitor-console__link').click();
  await expect(page.locator('.investigation-host__heading h3')).toContainText('203.0.113.42');
  await expect(page.locator('.stage-workbench__step').last()).toHaveAttribute(
    'aria-selected',
    'true',
  );
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
