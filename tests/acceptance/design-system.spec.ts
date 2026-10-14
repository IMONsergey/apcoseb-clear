import { expect, test, type Page } from '@playwright/test';

async function appearance(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  return page.locator('main h1, main h2, .header-signin, .footer-meta').evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      return {
        text: element.textContent,
        font: style.font,
        spacing: style.letterSpacing,
        color: style.color,
        background: style.backgroundColor,
        radius: style.borderRadius,
      };
    }),
  );
}

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`route CSS is independent of navigation order at ${width}px in ${theme}`, async ({
      page,
      baseURL,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript((value) => localStorage.setItem('apcosys-theme-mode', value), theme);
      const routes = [
        '/',
        '/about',
        '/platform/search-investigation',
        '/pricing',
        '/legal/privacy-policy',
      ];
      const cold = new Map<string, Awaited<ReturnType<typeof appearance>>>();
      for (const path of routes) {
        await page.goto('.' + path);
        await expect(page.locator('main h1')).toBeVisible();
        cold.set(path, await appearance(page));
      }
      // Keep one document alive while lazy styles accumulate, then revisit in reverse order.
      for (const path of [...routes, ...[...routes].reverse()]) {
        const target = new URL('.' + path, baseURL);
        await page.evaluate((target) => {
          const link = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].find(
            (anchor) => new URL(anchor.href).pathname === target && !new URL(anchor.href).hash,
          );
          if (!link) throw new Error(`No real navigation link to ${target}`);
          link.click();
        }, target.pathname);
        await expect(page).toHaveURL(target.href);
        await expect.poll(() => appearance(page)).toEqual(cold.get(path));
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        ).toBeLessThanOrEqual(1);
      }
    });
  }
}
