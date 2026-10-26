import { expect, test } from '@playwright/test';
import { siteRoutes } from '../../src/content/routes';

// Compare actual component edges with the page's twelve-column lattice.
// Equal outer containers alone cannot detect the footer/CTA regression.
const structures = [
  '.footer-columns',
  '.footer-bottom',
  '.data-metrics',
  '.legal-header',
  '.summary-grid',
  '.home-searchable__layout',
  '.home-usecases__grid',
  '.home-capabilities__stage',
  '.audience-grid',
  '.api-grid',
  '.plan-grid',
  '.home-team-cta__layout',
  '.faq-grid',
  '.stage-page-hero__grid',
  '.stage-related__inner',
  '.editorial-opening--illustrated',
  '.reading-rows',
  '.evidence-reading',
  '.coverage-register',
  '.collection-layout',
  '.related-reading',
  '.stage-case-experience',
  '.stage-example-journey',
  '.research-pairs',
  '.indicator-approach',
  '.team-workflow__layout',
  '.team-handoff',
  '.business-allowance',
  '.api-first-request',
  '.api-access-layout',
  '.pricing-heading',
  '.usage-layout',
  '.stage-token-grid',
  '.about-statement',
  '.about-path',
  '.scanning-request',
  '.contact-topics',
  '.stage-contact-layout',
  '.legal-documents',
];

for (const width of [320, 390, 767, 768, 1024, 1199, 1200, 1440, 1920, 2560]) {
  test(`structural columns align across all routes at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const { path } of siteRoutes) {
      await page.goto('.' + path);
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate((selectors) => {
        const rail = document.querySelector('.header-row')!.getBoundingClientRect();
        // Independent design-contract measurement, not the component's computed gap.
        const gap = Math.min(40, Math.max(24, innerWidth * 0.025));
        const unit = (rail.width + gap) / 12;
        const starts = Array.from({ length: 12 }, (_, i) => rail.left + i * unit);
        const ends = Array.from({ length: 12 }, (_, i) => rail.left + (i + 1) * unit - gap);
        const groups = Array.from(document.querySelectorAll(selectors.join(',')))
          .map((el) => {
            const style = getComputedStyle(el),
              rect = el.getBoundingClientRect();
            if (style.display !== 'grid' || rect.width === 0) return null;
            return {
              name: el.className,
              columns: style.gridTemplateColumns.split(' ').length,
              children: Array.from(el.children)
                .filter((c) => c.getBoundingClientRect().width > 0)
                .map((c) => {
                  const r = c.getBoundingClientRect();
                  // The grid item's box may deliberately hug content (artwork, billing).
                  const cs = getComputedStyle(c);
                  return {
                    name: c.className,
                    left: r.left,
                    right: r.right,
                    hug:
                      cs.justifySelf === 'start' ||
                      cs.justifySelf === 'end' ||
                      cs.justifySelf === 'center' ||
                      c.matches('.inner-artwork,.billing'),
                  };
                }),
            };
          })
          .filter((g) => g && g.columns > 1);
        const legal = document.querySelector('.legal-reading');
        return {
          starts,
          ends,
          groups,
          left: rail.left,
          right: rail.right,
          actions: Array.from(
            document.querySelectorAll('.stage-related__links, .legal-tools, .footer-meta'),
          ).map((group) => {
            const children = Array.from(group.children)
              .map((child) => child.getBoundingClientRect())
              .filter((rect) => rect.width > 0 && rect.height > 0);
            return {
              name: group.className,
              related: group.matches('.stage-related__links'),
              left: Math.min(...children.map((rect) => rect.left)),
              right: Math.max(...children.map((rect) => rect.right)),
            };
          }),
          legal: legal && innerWidth >= 768 ? legal.getBoundingClientRect().left : null,
        };
      }, structures);
      for (const action of geometry.actions) {
        // Stacked related actions share the copy's left rail; other action groups stay right.
        const side = width <= 767 && action.related ? 'left' : 'right';
        expect(
          Math.abs(action[side] - geometry[side]),
          `${path}: ${action.name} visible content reaches the ${side} page rail`,
        ).toBeLessThanOrEqual(1);
      }
      for (const group of geometry.groups) {
        for (const child of group!.children) {
          if (child.hug) continue;
          expect
            .soft(
              Math.min(...geometry.starts.map((x) => Math.abs(x - child.left))),
              `${path}: ${group!.name} / ${child.name} left`,
            )
            .toBeLessThanOrEqual(1);
          expect
            .soft(
              Math.min(...geometry.ends.map((x) => Math.abs(x - child.right))),
              `${path}: ${group!.name} / ${child.name} right`,
            )
            .toBeLessThanOrEqual(1);
        }
      }
      if (geometry.legal !== null)
        expect
          .soft(Math.abs(geometry.legal - geometry.starts[4]!), `${path}: legal reading rail`)
          .toBeLessThanOrEqual(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        path,
      ).toBeLessThanOrEqual(1);
    }
  });
}
