import { expect, test } from '@playwright/test';
import { legalRoutes } from '../../src/content/legal-routes';
import { deploymentSettings } from '../helpers/public-settings';

for (const width of [320, 390, 600, 768, 900, 1000, 1280, 1440, 1920]) {
  test(`legal first screen stays aligned across all documents at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('.' + legalRoutes[0].path);
    const positions: Record<string, number>[] = [];
    for (const route of legalRoutes) {
      const navigation = page.getByRole('navigation', { name: 'Legal documents' });
      if (route !== legalRoutes[0])
        await navigation.getByRole('link', { name: route.title, exact: true }).click();
      await expect(page.locator('main h1')).toHaveText(route.title);
      await page.evaluate(() => document.fonts.ready);
      positions.push(
        await page.evaluate(() => {
          const box = (selector: string) =>
            document.querySelector(selector)!.getBoundingClientRect();
          if (innerWidth >= 768)
            return Object.fromEntries(
              ['.legal-description', '.legal-updated', '.legal-documents', '.legal-layout'].map(
                (selector) => [selector, box(selector).top + scrollY],
              ),
            );

          // Reconstruct natural text line boxes, including leading, without reserved grid height.
          const textBounds = (selector: string) => {
            const element = document.querySelector(selector)!;
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            const rects: { top: number; bottom: number }[] = [];
            let node: Node | null;
            while ((node = walker.nextNode())) {
              if (!node.textContent?.trim()) continue;
              const style = getComputedStyle(node.parentElement!);
              if (style.visibility !== 'visible') continue;
              const lineHeight = Number.parseFloat(style.lineHeight);
              if (!Number.isFinite(lineHeight) || lineHeight <= 0)
                throw new Error('Legal text must expose its line height');
              const range = document.createRange();
              range.selectNodeContents(node);
              for (const rect of Array.from(range.getClientRects())) {
                if (rect.width <= 0 || rect.height <= 0) continue;
                const halfLeading = (lineHeight - rect.height) / 2;
                rects.push({
                  top: rect.top - halfLeading,
                  bottom: rect.bottom + halfLeading,
                });
              }
            }
            return rects.length
              ? {
                  label: selector,
                  top: Math.min(...rects.map((rect) => rect.top)),
                  bottom: Math.max(...rects.map((rect) => rect.bottom)),
                }
              : null;
          };
          const title = textBounds('.legal-header h1');
          const description = textBounds('.legal-description');
          const controls = Array.from(document.querySelector('.legal-tools')!.children)
            .filter((element) => getComputedStyle(element).visibility === 'visible')
            .map((element) => element.getBoundingClientRect())
            .filter((rect) => rect.width > 0 && rect.height > 0);
          if (!title || !description || controls.length === 0)
            throw new Error('Legal header text and controls must be visible');
          const visible = [
            title,
            description,
            textBounds('.legal-updated'),
            {
              label: '.legal-tools',
              top: Math.min(...controls.map((rect) => rect.top)),
              bottom: Math.max(...controls.map((rect) => rect.bottom)),
            },
            ...['.legal-documents', '.legal-mobile-contents', '.legal-layout'].map((selector) => ({
              label: selector,
              top: box(selector).top,
              bottom: box(selector).bottom,
            })),
          ].filter((item) => item !== null);
          return Object.fromEntries(
            visible.slice(1).map((item, index) => [
              visible[index]!.label + ' → ' + item.label,
              item.top - visible[index]!.bottom,
            ]),
          );
        }),
      );
      if (width < 768) {
        // Existing design spacing: space-4 between copy, space-5 around tools, adjacent flow after nav.
        const expectedGaps: Record<string, number> = {
          '.legal-description': 16,
          '.legal-updated': 16,
          '.legal-tools': 20,
          '.legal-documents': 20,
          '.legal-mobile-contents': 0,
          '.legal-layout': 0,
        };
        for (const [label, gap] of Object.entries(positions.at(-1)!)) {
          const destination = label.split(' → ').at(-1)!;
          expect(
            Math.abs(gap - expectedGaps[destination]!),
            route.path + ': ' + label + ' = ' + gap,
          ).toBeLessThanOrEqual(1);
        }
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    }
    for (const label of new Set(positions.flatMap((row) => Object.keys(row)))) {
      const values = positions.flatMap((row) => (label in row ? [row[label]!] : []));
      expect(
        Math.max(...values) - Math.min(...values),
        JSON.stringify(positions),
      ).toBeLessThanOrEqual(1);
    }
  });
}

for (const width of [390, 1440]) {
  test(`Sign In is a grey animated link to the client site at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('./');
    if (width < 1200) await page.getByRole('button', { name: 'Open navigation' }).click();
    const scope =
      width < 1200
        ? page.getByRole('dialog', { name: 'Navigation' })
        : page.locator('.site-header');
    const link = scope.getByRole('link', { name: 'Sign In', exact: true });
    await expect(link).toHaveAttribute('href', deploymentSettings.signInUrl);
    await expect(link).not.toHaveAttribute('aria-disabled', 'true');
    const style = await link.evaluate((e) => ({
      background: getComputedStyle(e).backgroundColor,
      transition: getComputedStyle(e).transitionDuration,
      pointer: getComputedStyle(e).pointerEvents,
    }));
    expect(style.background).toBe('rgb(236, 238, 241)');
    expect(style.transition.split(',').some((value) => parseFloat(value) > 0)).toBe(true);
    expect(style.pointer).not.toBe('none');
    await page.route(deploymentSettings.signInUrl, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<h1>Client website</h1>' }),
    );
    await link.click();
    await expect(page).toHaveURL(deploymentSettings.signInUrl);
  });
}
