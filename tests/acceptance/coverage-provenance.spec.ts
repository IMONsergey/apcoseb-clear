import { expect, test } from '@playwright/test';

// Public statistics response verified on 23 October 2026. This independent
// fixture guards against mixing the approved snapshot with old preview copy.
const snapshot = {
  timestamp: '2026-10-23T15:09:24.000Z',
  source: 'https://api.apcosys.net/api/statistics',
  values: [117_699_441, 161_719_645, 839_953_442, 1_348_017_100, 794_597, 54],
  fields: ['ipv4', 'ipv6', 'domains', 'products', 'cves', 'protocols'],
};

for (const locale of ['en', 'ru', 'zh-Hant']) {
  for (const width of [320, 1440]) {
    test(`methodology exposes the dated public source and complete counters in ${locale} at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const prefix = locale === 'en' ? './' : `./${locale.toLowerCase()}/`;
      await page.goto(`${prefix}platform/data-methodology`);
      const coverage = page.locator('#coverage');
      const source = coverage.locator(`a[href="${snapshot.source}"]`);
      await expect(source).toBeVisible();
      await expect(source).toHaveAccessibleName(/\S/);
      const date = coverage.locator('time');
      await expect(date).toHaveAttribute('datetime', snapshot.timestamp);
      await expect(date).toContainText(
        new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(snapshot.timestamp)),
      );

      const records = coverage.locator('.coverage-register article');
      await expect(records).toHaveCount(snapshot.fields.length);
      for (const [index, field] of snapshot.fields.entries()) {
        const record = records.nth(index);
        await expect(record.locator('p')).toContainText(field);
        await expect(record.locator('strong')).toHaveText(
          new Intl.NumberFormat(locale).format(snapshot.values[index]!),
        );
        // Validate the visible glyph range, not only the element's layout box:
        // large localized numbers must remain inside their own record and page.
        const bounds = await record.locator('strong').evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const glyphs = range.getBoundingClientRect();
          const card = element.closest('article')!.getBoundingClientRect();
          return {
            left: glyphs.left,
            right: glyphs.right,
            cardLeft: card.left,
            cardRight: card.right,
            viewport: document.documentElement.clientWidth,
          };
        });
        expect(bounds.left).toBeGreaterThanOrEqual(Math.max(0, bounds.cardLeft) - 1);
        expect(bounds.right).toBeLessThanOrEqual(Math.min(bounds.cardRight, bounds.viewport) + 1);
      }
      if (locale === 'en') {
        await expect(coverage).toContainText('dated snapshot');
        await expect(coverage).toContainText('does not specify counting or deduplication rules');
        await expect(coverage).not.toContainText('Client-preview figures');
        await expect(coverage).not.toContainText('CVE associations are records');
        await expect(coverage).not.toContainText(
          'Product detections derived from service responses',
        );
      }
    });
  }
}
