import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';

const marketing = siteRoutes.filter(
  ({ path, group }) => path !== '/' && group !== 'legal' && group !== 'documentation',
);
for (const width of [768, 1000, 1001, 1440, 1920]) {
  test(`split work areas keep their reading rails at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const { path } of marketing) {
      await page.goto('.' + path);
      await expect(page.locator('h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => {
        const hero = document.querySelector('.stage-page-hero__grid')!;
        const box = hero.getBoundingClientRect();
        const gap = parseFloat(getComputedStyle(hero).columnGap);
        const rail = box.left + (box.width + gap) / 2;
        const selectors = [
          '.api-first-request > :last-child',
          '.usage-layout > :last-child',
          '.date-reading',
          '.handoff-record',
          '.scanning-request > aside',
          '.team-workflow__layout > :last-child',
          '.stage-related__links',
          ...(innerWidth > 1000 ? ['.api-usage', '.stage-contact-form'] : []),
        ];
        return {
          rail,
          left: box.left,
          right: box.right,
          stackedApiColumns:
            innerWidth <= 1000
              ? Array.from(document.querySelectorAll('.api-access-layout > *')).map((el) => {
                  const rect = el.getBoundingClientRect();
                  return {
                    name: el.className,
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom,
                  };
                })
              : [],
          items: Array.from(document.querySelectorAll(selectors.join(',')))
            .filter((el) => el.getBoundingClientRect().width > 0)
            .map((el) => ({
              name: el.className || el.parentElement?.className,
              left: el.getBoundingClientRect().left,
            })),
        };
      });
      for (const item of geometry.items)
        expect(Math.abs(item.left - geometry.rail), `${path}: ${item.name}`).toBeLessThanOrEqual(1);
      if (path === '/developers/api' && width <= 1000) {
        expect(
          geometry.stackedApiColumns,
          'API access and usage both occupy the page rail',
        ).toHaveLength(2);
        for (const [index, column] of geometry.stackedApiColumns.entries()) {
          expect(
            Math.abs(column.left - geometry.left),
            `${path}: ${column.name} left`,
          ).toBeLessThanOrEqual(1);
          expect(
            Math.abs(column.right - geometry.right),
            `${path}: ${column.name} right`,
          ).toBeLessThanOrEqual(1);
          if (index > 0)
            expect(
              column.top - geometry.stackedApiColumns[index - 1]!.bottom,
              `${path}: the usage explanation follows the full-width API table`,
            ).toBeGreaterThanOrEqual(31);
        }
      }
    }
  });
}

test('parallel feature copy aligns naturally across wrapped titles', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const path of [
    '/platform/search-investigation',
    '/platform/data-methodology',
    '/platform/monitoring',
    '/use-cases/vulnerability-research',
    '/developers/api',
  ]) {
    await page.goto('.' + path);
    await expect(page.locator('h1')).toBeVisible();
    const rows = await page
      .locator('.feature-columns, .query-guide, .change-ledger, .evidence-levels')
      .evaluateAll((groups) =>
        groups.map((group) =>
          Array.from(group.querySelectorAll(':scope > article > p')).map(
            (p) => p.getBoundingClientRect().top,
          ),
        ),
      );
    for (const row of rows)
      expect(Math.max(...row) - Math.min(...row), path).toBeLessThanOrEqual(1);
  }
});

test('mobile detail paragraphs return to the page rail, without a hanging number gutter', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./use-cases/bug-bounty');
  const rows = page.locator('.reading-row');
  await expect(rows.first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const offsets = await rows.evaluateAll((elements) =>
    elements.map(
      (row) =>
        row.querySelector('p')!.getBoundingClientRect().left - row.getBoundingClientRect().left,
    ),
  );
  expect(offsets.length).toBeGreaterThan(0);
  for (const offset of offsets) expect(Math.abs(offset)).toBeLessThanOrEqual(1);
});

test('document contents follows long sections and reverse reading', async ({ page }) => {
  await page.goto('./legal/terms');
  const headings = page.locator('.legal-copy h2');
  for (const index of [2, 10, 5]) {
    const id = await headings.nth(index).getAttribute('id');
    await headings
      .nth(index)
      .evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 110));
    await expect(page.locator('.legal-sidebar a[aria-current="location"]')).toHaveAttribute(
      'href',
      '#' + id,
    );
  }
});

test('evidence flow stays still for reduced motion and keeps the explanation in text', async ({
  page,
}) => {
  await page.goto('./platform/data-methodology');
  const canvas = page.locator('.evidence-flow');
  await canvas.scrollIntoViewIfNeeded();
  const before = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  await page.waitForTimeout(150);
  expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(before);
  await expect(page.locator('.evidence-levels article')).toHaveCount(3);
  await expect(canvas).toHaveAttribute('aria-hidden', 'true');
});

test('the API sample begins level with its setup steps', async ({ page }) => {
  await page.goto('./developers/api');
  const setup = await page.locator('.api-setup').boundingBox();
  const code = await page.locator('.stage-code-window').boundingBox();
  expect(Math.abs(setup!.y - code!.y)).toBeLessThanOrEqual(1);
});

test('the evidence trace makes one quiet pass and then stops', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./platform/data-methodology');
  const canvas = page.locator('.evidence-flow');
  await canvas.scrollIntoViewIfNeeded();
  const frame = async () =>
    createHash('sha256')
      .update(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL()))
      .digest('hex');
  const start = await frame();
  await expect.poll(frame).not.toBe(start);
  await page.waitForTimeout(4600);
  const settled = await frame();
  await page.waitForTimeout(250);
  expect(await frame()).toBe(settled);
});
