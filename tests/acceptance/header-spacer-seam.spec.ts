import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  for (const width of [390, 1440]) {
    test(`fixed header has no visible spacer band on scroll-up in ${theme} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((value) => localStorage.setItem('apcosys-theme-mode', value), theme);
      await page.goto('./', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('.hero h1')).toBeVisible();

      const inspect = () =>
        page.evaluate(() => {
          const spacer = document.querySelector<HTMLElement>('.header-spacer')!;
          const header = document.querySelector<HTMLElement>('.site-header')!;
          const hero = document.querySelector<HTMLElement>('.hero')!;
          const site = document.querySelector<HTMLElement>('.site')!;
          const background = (element: HTMLElement) => getComputedStyle(element).backgroundColor;
          return {
            spacerColor: background(spacer),
            headerColor: background(header),
            heroColor: background(hero),
            pageColor: background(site),
            spacerHeight: spacer.getBoundingClientRect().height,
            heroTop: hero.getBoundingClientRect().top,
            scrollY: window.scrollY,
          };
        });

      const initial = await inspect();
      expect(initial.spacerColor).toBe(initial.headerColor);
      expect(initial.spacerColor).toBe(initial.heroColor);
      expect(initial.spacerColor).not.toBe(initial.pageColor);
      expect(initial.heroTop).toBeCloseTo(initial.spacerHeight, 1);

      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, 600);
        window.scrollTo(0, 0);
      });
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

      const returned = await inspect();
      expect(returned.spacerColor).toBe(returned.heroColor);
      expect(returned.headerColor).toBe(returned.heroColor);
      expect(returned.heroTop).toBeCloseTo(initial.spacerHeight, 1);
    });
  }
}
