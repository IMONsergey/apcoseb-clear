import { expect, test } from '@playwright/test';

const routes = [
  '/platform/search-investigation',
  '/platform/data-methodology',
  '/platform/monitoring',
  '/use-cases/bug-bounty',
  '/use-cases/vulnerability-research',
  '/use-cases/osint-threat-investigation',
  '/teams',
  '/developers/api',
  '/about',
  '/responsible-scanning',
  '/contact',
];

for (const width of [768, 1024, 1280, 1920]) {
  test(`parallel prose, annotations and links share rows at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const path of routes) {
      await page.goto('.' + path);
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const groups = await page
        .locator(
          '.reading-rows,.research-pairs,.scanning-records,.feature-columns,.query-guide,.change-ledger,.evidence-levels,.related-reading,.contact-topics',
        )
        .evaluateAll((els) =>
          els.map((el) => ({
            name: el.className,
            items: [...el.children].map((item) => ({
              top: Math.round(item.getBoundingClientRect().top),
              paragraph: item.querySelector('p')?.getBoundingClientRect().top,
              measure: item.querySelector('p')?.getBoundingClientRect().width,
              note: item.querySelector('.reading-row__detail')?.getBoundingClientRect().top,
              link: item.querySelector(':scope > span:last-child')?.getBoundingClientRect().top,
            })),
          })),
        );
      for (const group of groups) {
        const rows = new Map<number, typeof group.items>();
        for (const item of group.items) {
          rows.set(item.top, [...(rows.get(item.top) ?? []), item]);
          expect(
            item.measure ?? 999,
            `${path}: ${group.name} prose measure`,
          ).toBeGreaterThanOrEqual(240);
        }
        // Three equal items may form one row or three readable rows, never an orphaned 2+1.
        if (group.items.length === 3) expect(rows.size, `${path}: orphaned card`).not.toBe(2);
        for (const row of rows.values()) {
          for (const key of ['paragraph', 'note', 'link'] as const) {
            const positions = row
              .map((item) => item[key])
              .filter((x): x is number => x !== undefined);
            if (positions.length > 1)
              expect(
                Math.max(...positions) - Math.min(...positions),
                `${path}: ${group.name} ${key}`,
              ).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });
}

test('plan cards follow the section gap and headings use the editorial scale', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const path of ['/pricing', '/contact']) {
    await page.goto('.' + path);
    await expect(page.locator('main h1')).toBeVisible();
    const sizes = await page
      .locator('.pricing-heading h2,.stage-contact-aside h2,.editorial-heading h2')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).fontSize));
    expect(new Set(sizes).size).toBe(1);
  }
  await page.goto('./pricing');
  await expect(page.locator('.plan-grid')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const spacing = await page.evaluate(() => {
    const heading = document.querySelector('.pricing-heading')!;
    const cards = document.querySelector('.plan-grid')!;
    return {
      actual: cards.getBoundingClientRect().top - heading.getBoundingClientRect().bottom,
      intended: parseFloat(getComputedStyle(heading).marginBottom),
      cardGap: getComputedStyle(cards).columnGap,
      railGap: getComputedStyle(document.querySelector('.stage-page-hero__grid')!).columnGap,
    };
  });
  expect(spacing.actual).toBeCloseTo(spacing.intended, 0);
  expect(spacing.cardGap).toBe(spacing.railGap);
});

test('use-case labels have breathing room above their text', async ({ page }) => {
  for (const path of routes.filter((route) => route.startsWith('/use-cases/'))) {
    await page.goto('.' + path);
    await expect(page.locator('.stage-example-journey')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const insets = await page.locator('.stage-example-journey > div').evaluateAll((els) =>
      els.map((el) => ({
        inset:
          el.querySelector('span')!.getBoundingClientRect().top - el.getBoundingClientRect().top,
        font: parseFloat(getComputedStyle(el.querySelector('p')!).fontSize),
      })),
    );
    expect(insets).toHaveLength(4);
    for (const item of insets) {
      expect(item.inset).toBeGreaterThanOrEqual(18);
      expect(item.font).toBeGreaterThanOrEqual(17);
    }
  }
});
